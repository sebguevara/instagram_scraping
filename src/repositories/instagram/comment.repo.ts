import { apifyClient, prisma } from '@/config'
import { APIFY_IG_ACTORS, COMMENT_IG_ACTOR_PARAMS } from '@/const'
import { getAnalyzedComment, getPostByUrl } from '@/utils'
import { mapApifyCommentToComment } from '@/mappers'
import type {
  ApifyIGCommentResponse,
  IGCommentAnalysisEntity,
  IGCommentEntity,
  IGPostEntity,
} from '@/interfaces'
import pLimit from 'p-limit'

/**
 * Creates comments for the given posts by fetching them from Apify,
 * mapping and saving them to the database, and then analyzing them.
 * Updates existing comments and creates new ones as needed.
 * @param {PostEntity[]} posts - List of posts to fetch and process comments for
 * @returns {Promise<CommentAnalysisEntity[]>} List of analyzed comments
 * @throws {Error} If no comment data is found or if an unexpected error occurs
 */
export const createComments = async (posts: IGPostEntity[]): Promise<IGCommentAnalysisEntity[]> => {
  try {
    // Map Instagram post IDs to database post IDs
    const igIdPostIdMap = new Map(posts.map((item) => [getPostByUrl(item.link), item.id]))

    // Call Apify actor to fetch comments for the given posts
    const { defaultDatasetId } = await apifyClient.actor(APIFY_IG_ACTORS.COMMENT_ACTOR).call({
      startUrls: posts.map((item) => item.link),
      ...COMMENT_IG_ACTOR_PARAMS,
    })

    // Get items (comments) from the Apify dataset
    const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
    const data = items as unknown as ApifyIGCommentResponse[]
    if (data.length <= 0) throw new Error('No data found')

    // Filter out duplicate or invalid comments
    const dataFiltered = data.filter(
      (item) =>
        !item.noResults &&
        data.filter(
          (other) =>
            item.postId === other.postId &&
            item.user.username === other.user.username &&
            item.message === other.message
        ).length === 1
    )

    // Map Apify data to comment entity format
    const commentsMapped = dataFiltered.map((item) =>
      mapApifyCommentToComment(item, igIdPostIdMap.get(item.postId)!)
    )

    // Find already existing comments in the database
    const commentsInDb = await prisma.comment_entity.findMany({
      where: { instagramid: { in: commentsMapped.map((item) => item.instagramid!) } },
    })

    // Update existing comments
    for (const comment of commentsInDb) {
      const commentData = commentsMapped.find((item) => item.instagramid === comment.instagramid)
      if (!commentData) continue
      await prisma.comment_entity.update({ where: { id: comment.id }, data: commentData })
    }

    // Filter comments that do not exist yet to create them
    const commentsToCreate = commentsMapped.filter(
      (item) => !commentsInDb.some((comment) => comment.instagramid === item.instagramid)
    )

    // Create new comments in the database
    if (commentsToCreate.length > 0) {
      for (const comment of commentsToCreate) {
        await prisma.comment_entity.create({ data: comment })
      }
    }

    // Get all stored comments (existing and new)
    const allComments = (await prisma.comment_entity.findMany({
      where: { instagramid: { in: commentsMapped.map((item) => item.instagramid!) } },
    })) as unknown as IGCommentEntity[]

    // Analyze all comments
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
  comments: IGCommentEntity[]
): Promise<IGCommentAnalysisEntity[]> => {
  try {
    // Limit concurrency to 10 for analysis requests
    const limit = pLimit(8)
    console.log(comments.length)

    // Analyze each comment (emotion, topic, request)
    const commentAnalysis = (await Promise.all(
      comments.map((comment) =>
        limit(async () => {
          const commentAnalysis = await getAnalyzedComment(comment.comment)
          return {
            comment_entity_id: comment.id!,
            post_id: comment.postId,
            emotion: commentAnalysis.emotion,
            topic: commentAnalysis.topic,
            request: commentAnalysis.request,
            analyzedat: new Date(),
            updatedat: new Date(),
          }
        })
      )
    )) as unknown as IGCommentAnalysisEntity[]

    // Find already existing analysis records in the database
    const commentAnalysisInDb = await prisma.comment_analysis.findMany({
      where: { comment_entity_id: { in: commentAnalysis.map((item) => item.comment_entity_id) } },
    })

    // Find analysis records to update
    const commentAnalysisToUpdate = commentAnalysisInDb.filter(
      (item) =>
        !commentAnalysis.some((comment) => comment.comment_entity_id === item.comment_entity_id)
    )

    // Update existing analysis records
    if (commentAnalysisToUpdate.length > 0) {
      for (const comment of commentAnalysisToUpdate) {
        const commentAnalysisToUpdate = commentAnalysis.find(
          (item) => item.comment_entity_id === comment.comment_entity_id
        )
        if (!commentAnalysisToUpdate) continue
        await prisma.comment_analysis.update({
          where: { id: comment.id },
          data: commentAnalysisToUpdate,
        })
      }
    }

    // Filter analysis records that do not exist yet to create them
    const commentAnalysisToCreate = commentAnalysis.filter(
      (item) =>
        !commentAnalysisInDb.some((comment) => comment.comment_entity_id === item.comment_entity_id)
    )

    // Create new analysis records in the database
    for (const comment of commentAnalysisToCreate) {
      await prisma.comment_analysis.create({ data: comment })
    }
    return commentAnalysis
  } catch (error) {
    console.error('Error in createCommentAnalysis:', error)
    throw new Error(
      'Failed to analyze comments: ' + (error instanceof Error ? error.message : String(error))
    )
  }
}

/**
 * Obtiene todos los posts con sus comentarios y análisis asociados.
 */
export const getPostsWithCommentsAndAnalysis = async () => {
  return prisma.instagram_post.findMany({
    include: {
      comment_entity: true,
      comment_analysis: true,
    },
  })
}

/**
 * Actualiza el campo numberOfComments de un post.
 */
export const updatePostNumberOfComments = async (postId: number, realCount: number) => {
  return prisma.instagram_post.update({
    where: { id: postId },
    data: { numberOfComments: realCount },
  })
}

/**
 * Obtiene los posts creados entre dos fechas, con condiciones específicas.
 */
export const getPostsByDateWithComments = async (startDate: Date, endDate: Date) => {
  return prisma.instagram_post.findMany({
    where: {
      postDate: {
        gte: startDate,
        lte: endDate,
      },
      numberOfComments: { not: 0 },
      post_analysis: {
        post_topic_id: { not: 21 },
      },
    },
  })
}

/**
 * Obtiene los comentarios cuya scrapDate sea mayor o igual a la fecha indicada.
 */
export const getCommentsByDate = async () => {
  return prisma.comment_entity.findMany({
    where: {
      comment_analysis: {
        is: null,
      },
    },
  })
}
