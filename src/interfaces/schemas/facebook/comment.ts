export interface FBCommentEntity {
  id?: number
  postID?: number
  primaryCommentID?: number
  commentContent: string
  commentOwnerUsername: string
  likesOfComment?: number
  scrap_date?: Date
  comment_date?: Date
}

export interface FBCommentEntityWithRelations extends FBCommentEntity {
  facebook_comment_analysis?: FBCommentAnalysisEntity
  parent_comment?: FBCommentEntity
  replies?: FBCommentEntity[]
}

export interface FBCommentAnalysisEntity {
  id?: number
  facebookCommentID?: number
  topic?: string
  emotion?: string
  request?: string
  analyzedAt?: Date
  updatedAt?: Date
}
