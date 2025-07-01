export interface FBCommentEntity {
  id?: number
  commentContent: string
  commentOwnerUsername: string
  likesOfComment: number
  scrap_date: Date
  comment_date: Date
  postID: number
  primaryCommentID?: number
}

export interface FBCommentAnalysisEntity {
  id?: number
  topic?: string
  emotion?: string
  request?: string
  analyzedAt?: Date
  updatedAt?: Date
  facebookCommentID: number
}
