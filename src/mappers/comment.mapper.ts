import type { ApifyCommentResponse, CommentEntity } from '@/interfaces/comment'

export const mapApifyCommentToComment = (item: ApifyCommentResponse, postId: number) => {
  return {
    postId: postId,
    comment: item.message,
    commentOwnerName: item.user.username,
    likesOfComment: item.likeCount,
    commentDate: new Date(item.createdAt),
    scrapDate: new Date(),
    originalCommentId: undefined,
  } as CommentEntity
}
