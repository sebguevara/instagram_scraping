export interface CommentEntity {
  id?: number
  comment: string
  commentOwnerName: string
  likesOfComment: number
  scrapDate: Date
  commentDate: Date
  originalCommentId?: number
  postId: number
}

export interface ApifyCommentResponse {
  postId: string
  id: string
  userId: number
  message: string
  createdAt: number
  shareEnabled: boolean
  user: User
  isRanked: boolean
  likeCount: number
  noResults?: boolean
}

interface User {
  id: number
  username: string
  image: string
  isVerified: boolean
}
