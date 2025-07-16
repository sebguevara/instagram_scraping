import type { ApifyFBCommentResponse, FBCommentEntity } from '@/interfaces'

/**
 * Maps Apify comment data to a CommentEntity object.
 * @param {ApifyCommentResponse} item - The Apify comment data
 * @param {number} postId - The ID of the post that the comment belongs to
 * @returns {CommentEntity} The mapped comment entity
 */
export const mapApifyFBCommentToComment = (
  item: ApifyFBCommentResponse,
  postId: number
): FBCommentEntity => {
  return {
    postID: postId,
    commentContent: item.message,
    commentOwnerUsername: item.author.name,
    likesOfComment: Number(item.reactions_count),
    comment_date: new Date(item.created_time * 1000),
    scrap_date: new Date(),
    primaryCommentID: undefined,
    facebookCommentID: item.legacy_comment_id,
  } as FBCommentEntity
}
