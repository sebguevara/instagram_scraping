import type { CommentEntity, PostEntity } from '@/interfaces'
import {
  createCommentAnalysis,
  createComments,
  getPostsWithCommentsAndAnalysis,
  updatePostNumberOfComments,
  getPostsByDateWithComments,
  getCommentsByDate,
} from '@/repositories/comment.repo'

/**
 * Synchronizes the comment count of each post with the actual number of
 * comments stored in the `comment_entity` table. This ensures that queries
 * using `instagram_post.numberOfComments` and those counting records in
 * `comment_entity` return the same value.
 *
 * Additionally, it returns a summary of the posts that were updated for
 * verification or auditing purposes.
 *
 * @returns {Promise<{ postsUpdated: number; details: { postId: number; title: string; originalCount: number; realCount: number; analysisCount: number }[]; status: string }>}
 * @throws {Error} If no posts are found in the database.
 */
export const syncPostCommentCounts = async (): Promise<{
  postsUpdated: number
  details: {
    postId: number
    title: string
    originalCount: number
    realCount: number
    analysisCount: number
  }[]
  status: string
}> => {
  await analyzeComments()
  const posts = await getPostsWithCommentsAndAnalysis()

  if (posts.length === 0) {
    return {
      postsUpdated: 0,
      details: [],
      status: 'success',
    }
  }

  let postsUpdated = 0
  const details: {
    postId: number
    title: string
    originalCount: number
    realCount: number
    analysisCount: number
  }[] = []

  for (const post of posts) {
    const realCount = post.comment_entity.length
    const analysisCount = post.comment_analysis.length
    const originalCount = post.numberOfComments ?? 0

    const needsUpdate = realCount !== originalCount
    const hasMismatch = needsUpdate || realCount !== analysisCount

    if (needsUpdate) {
      await updatePostNumberOfComments(post.id, realCount)
      postsUpdated++
    }

    if (hasMismatch) {
      details.push({
        postId: post.id,
        title: post.title,
        originalCount: originalCount,
        realCount: realCount,
        analysisCount: analysisCount,
      })
    }
  }

  return {
    postsUpdated,
    details,
    status: 'success',
  }
}

/**
 * Scrapes comments for posts created on a specific date and updates the comment analysis.
 * @returns {Promise<{ comments: number; status: string }>} An object containing the total number of comments and the status of the operation.
 */
export const scrapCommentsByDate = async (
  startDate: Date,
  endDate: Date
): Promise<{
  comments: number
  status: string
}> => {
  const posts = (await getPostsByDateWithComments(startDate, endDate)) as unknown as PostEntity[]

  if (posts.length === 0) {
    return {
      comments: 0,
      status: 'success',
    }
  }

  let totalComments = 0
  for (const post of posts) {
    const commentAnalysis = await createComments([post])
    totalComments += commentAnalysis.length
  }

  return {
    comments: totalComments,
    status: 'success',
  }
}

/**
 * Analyzes comments from the last 10 days.
 * @returns {Promise<{ comments: number; status: string }>} Object containing the number of comments analyzed and the status
 * @throws {Error} If no comments are found
 */
export const analyzeComments = async (): Promise<{ comments: number; status: string }> => {
  const comments = (await getCommentsByDate()) as unknown as CommentEntity[]

  if (comments.length <= 0) {
    return {
      comments: 0,
      status: 'success',
    }
  }

  const commentsAnalysis = await createCommentAnalysis(comments)
  return {
    comments: commentsAnalysis.length,
    status: 'success',
  }
}
