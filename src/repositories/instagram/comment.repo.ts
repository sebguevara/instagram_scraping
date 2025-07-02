import { apifyClient, prisma } from '@/config'
import { APIFY_IG_ACTORS, COMMENT_IG_ACTOR_PARAMS } from '@/const'
import { getAnalyzedComment, getPostByUrl } from '@/utils'
import { mapApifyCommentToComment } from '@/mappers'
import type {
  ApifyIGCommentResponse,
  IGCommentAnalysis,
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
export const createComments = async (posts: IGPostEntity[]): Promise<IGCommentAnalysis[]> => {
  try {
    const igIdPostIdMap = new Map(posts.map((item) => [getPostByUrl(item.link), item.id]))
    const { defaultDatasetId } = await apifyClient.actor(APIFY_IG_ACTORS.COMMENT_ACTOR).call({
      startUrls: posts.map((item) => item.link),
      ...COMMENT_IG_ACTOR_PARAMS,
    })

    const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
    const data = items as unknown as ApifyIGCommentResponse[]
    if (data.length <= 0) return []

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

    const commentsMapped = dataFiltered.map((item) =>
      mapApifyCommentToComment(item, igIdPostIdMap.get(item.postId)!)
    )

    const commentsInDb = await prisma.comment_entity.findMany({
      where: { instagramid: { in: commentsMapped.map((item) => item.instagramid!) } },
    })

    for (const comment of commentsInDb) {
      const commentData = commentsMapped.find((item) => item.instagramid === comment.instagramid)
      if (!commentData) continue
      await prisma.comment_entity.update({ where: { id: comment.id }, data: commentData })
    }

    const commentsToCreate = commentsMapped.filter(
      (item) => !commentsInDb.some((comment) => comment.instagramid === item.instagramid)
    )

    if (commentsToCreate.length > 0) {
      for (const comment of commentsToCreate) {
        await prisma.comment_entity.create({ data: comment })
      }
    }

    const allComments = (await prisma.comment_entity.findMany({
      where: { instagramid: { in: commentsMapped.map((item) => item.instagramid!) } },
    })) as unknown as IGCommentEntity[]

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
): Promise<IGCommentAnalysis[]> => {
  try {
    const limit = pLimit(10)
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
    )) as unknown as IGCommentAnalysis[]

    const commentAnalysisInDb = await prisma.comment_analysis.findMany({
      where: { comment_entity_id: { in: commentAnalysis.map((item) => item.comment_entity_id) } },
    })

    const commentAnalysisToUpdate = commentAnalysisInDb.filter(
      (item) => !commentAnalysis.some((c) => c.comment_entity_id === item.comment_entity_id)
    )

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

    const commentAnalysisToCreate = commentAnalysis.filter(
      (item) => !commentAnalysisInDb.some((c) => c.comment_entity_id === item.comment_entity_id)
    )

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
 * Gets all posts with their comments and analysis associated.
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
 * Updates the numberOfComments field of a post.
 */
export const updatePostNumberOfComments = async (postId: number, realCount: number) => {
  return prisma.instagram_post.update({
    where: { id: postId },
    data: { numberOfComments: realCount },
  })
}

/**
 * Gets the posts created between two dates, with specific conditions.
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
 * Gets the comments whose scrapDate is greater than or equal to the indicated date.
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
