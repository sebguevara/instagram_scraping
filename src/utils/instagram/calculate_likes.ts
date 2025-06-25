import { prisma } from '@/config'

/**
 * Calculates the average number of likes for a given account.
 * @param {number} accountId - The ID of the account to calculate the average number of likes for
 * @returns {Promise<number>} The average number of likes
 */
export const calculateLikes = async (accountId: number): Promise<number> => {
  const posts = await prisma.instagram_post.findMany({
    where: { accountId: accountId, numberOfLikes: { not: -1 } },
    orderBy: { postDate: 'desc' },
    take: 12,
  })

  const postWithMostLikes = posts.sort((a, b) => (b.numberOfLikes ?? 0) - (a.numberOfLikes ?? 0))[0]
  const postWithLessLikes = posts.sort((a, b) => (a.numberOfLikes ?? 0) - (b.numberOfLikes ?? 0))[0]

  const postsWithoutMostLikedAndLessLiked = posts.filter(
    (post) => post.id !== postWithMostLikes.id && post.id !== postWithLessLikes.id
  )

  const averageLikes =
    postsWithoutMostLikedAndLessLiked.reduce((acc, post) => acc + (post.numberOfLikes ?? 0), 0) /
    postsWithoutMostLikedAndLessLiked.length

  return Math.ceil(averageLikes)
}
