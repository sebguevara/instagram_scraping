import type { IGPostEntity } from '@/interfaces'

/**
 * Calculates the engagement of a post based on the number of likes and comments.
 * @param {PostEntity} post - The post to calculate the engagement for
 * @param {number} totalFollowers - The total number of followers of the account
 * @returns {number} The engagement of the post
 */
export const getPostEngagement = (post: IGPostEntity, totalFollowers: number): number => {
  return ((post.numberOfLikes + post.numberOfComments) / totalFollowers) * 100
}
