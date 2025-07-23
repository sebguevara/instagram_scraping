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
import { getIdFromUrl } from '@/utils/facebook/get_id_from_url'

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

    const dataFiltered = data.filter(
      (item) =>
        data.filter((other) => getIdFromUrl(item.commentUrl) === getIdFromUrl(other.commentUrl))
          .length === 1
    )

    const commentsMapped = dataFiltered.map((item) =>
      mapApifyFBCommentToComment(item, posts.find((post) => post.link === item.inputUrl)!.id!)
    )

    const commentsInDb = await prisma.facebook_comment_entity.findMany({
      where: { facebookCommentID: { in: commentsMapped.map((item) => item.facebookCommentID!) } },
    })

    for (const comment of commentsInDb) {
      const commentData = commentsMapped.find(
        (item) => item.facebookCommentID === comment.facebookCommentID
      )
      if (!commentData) continue
      await prisma.facebook_comment_entity.update({
        where: { id: comment.id },
        data: commentData,
      })
    }

    const commentsToCreate = commentsMapped.filter(
      (item) =>
        !commentsInDb.some((comment) => comment.facebookCommentID === item.facebookCommentID)
    )

    const commentsToCreateFiltered = commentsToCreate.filter(
      (item) => item.commentContent && item.commentOwnerUsername
    )

    if (commentsToCreateFiltered.length > 0) {
      for (const comment of commentsToCreateFiltered) {
        await prisma.facebook_comment_entity.create({ data: comment })
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

    const commentAnalysis = (await Promise.all(
      comments.map((comment) =>
        limit(async () => {
          const commentAnalysis = await getAnalyzedComment(comment.commentContent)
          return {
            commentID: comment.id!,
            postID: comment.postID,
            emotion: commentAnalysis.emotion,
            topic: commentAnalysis.topic,
            request: commentAnalysis.request,
            analyzedAt: new Date(),
            updatedAt: new Date(),
          }
        })
      )
    )) as FBCommentAnalysisEntity[]

    const commentAnalysisInDb = await prisma.facebook_comment_analysis.findMany({
      where: {
        commentID: {
          in: commentAnalysis.map((item) => item.commentID),
        },
      },
    })

    const commentAnalysisToUpdate = commentAnalysisInDb.filter((item) =>
      commentAnalysis.some((c) => c.id === item.id)
    )

    for (const existing of commentAnalysisToUpdate) {
      const updateData = commentAnalysis.find((c) => c.commentID === existing.commentID)
      if (!updateData) continue

      await prisma.comment_analysis.update({
        where: { id: existing.id },
        data: updateData,
      })
    }

    const commentAnalysisToCreate = commentAnalysis.filter(
      (item) => !commentAnalysisInDb.some((c) => c.commentID === item.commentID)
    )

    for (const comment of commentAnalysisToCreate) {
      const commentEntity = await prisma.facebook_comment_entity.findUnique({
        where: { id: comment.commentID },
      })

      if (!commentEntity) {
        const original = comments.find((c) => c.id === comment.commentID)
        if (original) {
          const entityData = {
            commentContent: original.commentContent,
            commentOwnerUsername: original.commentOwnerUsername,
            postID: original.postID,
            likesOfComment: original.likesOfComment ?? 0,
            scrap_date: original.scrap_date,
            comment_date: original.comment_date,
            commentID: original.id!,
          }

          await prisma.facebook_comment_entity.create({
            data: entityData as unknown as FBCommentEntity,
          })
        }
      }

      await prisma.facebook_comment_analysis.create({
        data: comment,
      })
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
