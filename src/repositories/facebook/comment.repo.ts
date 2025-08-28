import { apifyClient, prisma } from '@/config'
import { APIFY_FB_ACTORS, COMMENT_FB_ACTOR_PARAMS } from '@/const'
import { getAnalyzedComment } from '@/utils'
import type { ApifyFBCommentResponse } from '@/interfaces'
import pLimit from 'p-limit'
import type { FBPostEntity } from '@/interfaces/schemas/facebook/post'
import type {
  FBCommentAnalysisEntity,
  FBCommentEntity,
} from '@/interfaces/schemas/facebook/comment'
import { mapApifyFBCommentToComment } from '@/mappers/facebook/comment.mapper'

/**
 * Creates comments for the given posts by fetching them from Apify,
 * mapping and saving them to the database, and then analyzing them.
 * Updates existing comments and creates new ones as needed.
 * @param {PostEntity[]} posts - List of posts to fetch and process comments for
 * @returns {Promise<CommentAnalysisEntity[]>} List of analyzed comments
 * @throws {Error} If no comment data is found or if an unexpected error occurs
 */
export const createComments = async (posts: FBPostEntity[]): Promise<FBCommentAnalysisEntity[]> => {
  try {
    const { defaultDatasetId } = await apifyClient.actor(APIFY_FB_ACTORS.COMMENT_ACTOR).call({
      startUrls: posts.map((post) => ({
        url: post.link,
        method: 'GET',
      })),
      ...COMMENT_FB_ACTOR_PARAMS,
    })

    const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
    const data = items as unknown as ApifyFBCommentResponse[]
    if (data.length <= 0) return []

    let dataFiltered = data.filter((item) => item !== null && item !== undefined)

    dataFiltered = dataFiltered.filter((item) => item.commentUrl && !item.error)
    dataFiltered = dataFiltered.filter(
      (item, index, self) => index === self.findIndex((t) => t.commentUrl === item.commentUrl)
    )

    const commentsMapped = dataFiltered
      .map((item) => {
        const post = posts.find((p) => p.link === item.inputUrl)
        if (!post || !post.id) {
          console.warn(`Post no encontrado para la URL: ${item.inputUrl}. Omitiendo comentario.`)
          return null
        }
        return mapApifyFBCommentToComment(item, post.id)
      })
      .filter((comment): comment is NonNullable<typeof comment> => comment !== null)

    for (const commentData of commentsMapped) {
      if (
        !commentData.facebookCommentID ||
        !commentData.commentContent ||
        !commentData.commentOwnerUsername
      ) {
        continue
      }

      try {
        const { facebookCommentID, ...updateData } = commentData

        const validUpdateData = {
          postID: updateData.postID,
          primaryCommentID: updateData.primaryCommentID,
          commentContent: updateData.commentContent,
          commentOwnerUsername: updateData.commentOwnerUsername,
          likesOfComment: updateData.likesOfComment,
          scrap_date: updateData.scrap_date,
          comment_date: updateData.comment_date,
        }

        await prisma.facebook_comment_entity.update({
          where: { facebookCommentID: facebookCommentID },
          data: validUpdateData,
        })
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'P2025') {
          try {
            await prisma.facebook_comment_entity.create({
              data: commentData,
            })
          } catch (createError) {
            console.error('----------- ERROR AL CREAR (después de un update fallido) -----------')
            console.error('DATOS:', JSON.stringify(commentData, null, 2))
            console.error('ERROR DE CREACIÓN:', createError)
            throw new Error('Fallo en la creación del registro.')
          }
        } else {
          console.error('----------- ERROR INESPERADO AL ACTUALIZAR -----------')
          console.error('DATOS:', JSON.stringify(commentData, null, 2))
          console.error('ERROR DE ACTUALIZACIÓN:', error)
          throw new Error('Fallo inesperado durante la actualización.')
        }
      }
    }

    const allComments = (await prisma.facebook_comment_entity.findMany({
      where: { facebookCommentID: { in: commentsMapped.map((item) => item.facebookCommentID!) } },
    })) as unknown as FBCommentEntity[]

    const commentAnalysis = await createCommentAnalysis(allComments)
    return commentAnalysis
  } catch (error) {
    console.error('Error in createComments:', error)
    throw new Error(
      'Failed to create and analyze comments: ' +
        (error instanceof Error ? error.message : String(error))
    )
  }
}

/**
 * Analyzes the given comments, determining emotion, topic, and request for each.
 * Updates existing analysis records and creates new ones as needed.
 * @param {CommentEntity[]} comments - List of comments to analyze
 * @returns {Promise<CommentAnalysisEntity[]>} List of comment analysis records
 * @throws {Error} If an unexpected error occurs during analysis
 */
export const createCommentAnalysis = async (
  comments: FBCommentEntity[]
): Promise<FBCommentAnalysisEntity[]> => {
  try {
    const limit = pLimit(20)

    const analysisResults = await Promise.all(
      comments.map((comment) =>
        limit(async () => {
          try {
            const analysisResult = await getAnalyzedComment(comment.commentContent)
            return {
              commentID: comment.id!,
              postID: comment.postID,
              emotion: analysisResult.emotion,
              topic: analysisResult.topic,
              request: analysisResult.request,
              analyzedAt: new Date(),
              updatedAt: new Date(),
            }
          } catch (e) {
            console.error(
              `Falló el análisis para el comentario con ID: ${comment.id}. Contenido: "${comment.commentContent}"`,
              e
            )
            return null
          }
        })
      )
    )

    const newAnalyses = analysisResults.filter(Boolean) as FBCommentAnalysisEntity[]

    if (newAnalyses.length === 0) {
      console.log('No se pudo analizar ningún comentario con éxito.')
      return []
    }

    const existingAnalyses = await prisma.facebook_comment_analysis.findMany({
      where: {
        commentID: { in: newAnalyses.map((item) => item.commentID) },
      },
    })

    const analysesToCreate = newAnalyses.filter(
      (newAnalysis) =>
        !existingAnalyses.some((existing) => existing.commentID === newAnalysis.commentID)
    )

    const analysesToUpdate = newAnalyses.filter((newAnalysis) =>
      existingAnalyses.some((existing) => existing.commentID === newAnalysis.commentID)
    )

    for (const analysisData of analysesToUpdate) {
      const existing = existingAnalyses.find((e) => e.commentID === analysisData.commentID)
      if (existing) {
        await prisma.facebook_comment_analysis.update({
          where: { id: existing.id },
          data: analysisData,
        })
      }
    }

    if (analysesToCreate.length > 0) {
      await prisma.facebook_comment_analysis.createMany({
        data: analysesToCreate,
      })
    }

    return newAnalyses
  } catch (error) {
    console.error('Error in createCommentAnalysis:', error)
    throw new Error(
      'Failed to analyze comments: ' + (error instanceof Error ? error.message : String(error))
    )
  }
}

/**
 * Gets all posts with their comments and analysis associated.
 */
export const getPostsWithCommentsAndAnalysis = async (categoryId: number) => {
  return prisma.facebook_post.findMany({
    include: {
      facebook_comment_entity: true,
      facebook_comment_analysis: true,
      facebook_user_account: {
        where: {
          account_entity: {
            account_category_id: categoryId,
          },
        },
      },
    },
  })
}

/**
 * Updates the numberOfComments field of a post.
 */
export const updatePostNumberOfComments = async (postId: number, realCount: number) => {
  return prisma.facebook_post.update({
    where: { id: postId },
    data: { numberofcomments: realCount },
  })
}

/**
 * Gets the posts created between two dates, with specific conditions.
 */
export const getPostsByDateWithComments = async (startDate: Date, endDate: Date) => {
  return prisma.facebook_post.findMany({
    where: {
      postdate: {
        gte: startDate,
        lte: endDate,
      },
      numberofcomments: { not: 0 },
      facebook_post_analysis: {
        post_topic_id: { not: 21 },
      },
    },
  })
}

/**
 * Gets the comments whose scrapDate is greater than or equal to the indicated date.
 */
export const getCommentsByDate = async () => {
  return prisma.facebook_comment_entity.findMany({
    where: {
      facebook_comment_analysis: {
        is: null,
      },
    },
  })
}
