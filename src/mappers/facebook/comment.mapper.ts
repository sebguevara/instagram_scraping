import type { ApifyFBCommentResponse, FBCommentEntity } from '@/interfaces'
import { getIdFromUrl } from '@/utils/facebook/get_id_from_url'

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
    commentContent: item.text,
    commentOwnerUsername: item.profileName,
    likesOfComment: Number(item.likesCount),
    comment_date: new Date(item.date),
    scrap_date: new Date(),
    primaryCommentID: undefined,
    facebookCommentID: getIdFromUrl(item.commentUrl),
  } as FBCommentEntity
}
