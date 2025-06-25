import type { ApifyIGCommentResponse, IGCommentEntity } from '@/interfaces'

/**
 * Maps Apify comment data to a CommentEntity object.
 * @param {ApifyCommentResponse} item - The Apify comment data
 * @param {number} postId - The ID of the post that the comment belongs to
 * @returns {CommentEntity} The mapped comment entity
 */
export const mapApifyCommentToComment = (
  item: ApifyIGCommentResponse,
  postId: number
): IGCommentEntity => {
  return {
    postId: postId,
    comment: item.message,
    commentOwnerName: item.user.username,
    likesOfComment: item.likeCount,
    commentDate: new Date(item.createdAt * 1000),
    scrapDate: new Date(),
    originalCommentId: undefined,
    instagramid: item.id,
  } as IGCommentEntity
}
