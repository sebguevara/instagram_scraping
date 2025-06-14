import { prisma } from '@/config'
import type { PostEntity } from '@/interfaces'
import { createComments } from '@/repositories/comment.repo'

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
  // Fetch all posts with their associated comments
  const posts = await prisma.instagram_post.findMany({
    include: {
      comment_entity: true,
      comment_analysis: true,
    },
  })

  if (posts.length === 0) throw new Error('No posts found in the database')

  let postsUpdated = 0
  const details: {
    postId: number
    title: string
    originalCount: number
    realCount: number
    analysisCount: number
  }[] = []

  // Iterate through posts and compare the stored value with the actual count
  for (const post of posts) {
    const realCount = post.comment_entity.length
    const analysisCount = post.comment_analysis.length
    const originalCount = post.numberOfComments ?? 0

    const needsUpdate = realCount !== originalCount
    const hasMismatch = needsUpdate || realCount !== analysisCount

    if (needsUpdate) {
      // Update the numberOfComments field with the actual count
      await prisma.instagram_post.update({
        where: { id: post.id },
        data: { numberOfComments: realCount },
      })
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
  const posts = (await prisma.instagram_post.findMany({
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
  })) as unknown as PostEntity[]

  let totalComments = 0
  console.log(posts.length)
  for (const post of posts) {
    const commentAnalysis = await createComments([post])
    console.log(commentAnalysis.length)
    totalComments += commentAnalysis.length
  }

  return {
    comments: totalComments,
    status: 'success',
  }
}
