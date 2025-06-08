import type { ApifyCommentResponse, CommentEntity } from '@/interfaces'

export const mapApifyCommentToComment = (item: ApifyCommentResponse, postId: number) => {
  return {
    postId: postId,
    comment: item.message,
    commentOwnerName: item.user.username,
    likesOfComment: item.likeCount,
    commentDate: new Date(item.createdAt * 1000),
    scrapDate: new Date(),
    originalCommentId: undefined,
    instagramid: item.id,
  } as CommentEntity
}
