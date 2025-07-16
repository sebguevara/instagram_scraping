import type { FBPostEntity } from '@/interfaces/schemas/facebook/post'

/**
 * Calculates the engagement of a post based on the number of likes and comments.
 * @param {PostEntity} post - The post to calculate the engagement for
 * @param {number} totalFollowers - The total number of followers of the account
 * @returns {number} The engagement of the post
 */
export const getPostEngagement = (post: FBPostEntity, totalFollowers: number): number => {
  return ((post.numberoflikes + post.numberofcomments) / totalFollowers) * 100
}
