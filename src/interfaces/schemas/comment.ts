export interface CommentEntity {
  id?: number
  comment: string
  commentOwnerName: string
  likesOfComment: number
  scrapDate: Date
  commentDate: Date
  originalCommentId?: number
  postId: number
  instagramid?: string
}

export interface CommentAnalysisEntity {
  id?: number
  comment_entity_id: number
  post_id: number
  emotion: string
  topic: string
  request: string
  analyzedat?: Date
  updatedat?: Date
}

export interface CommentAnalysisRequest {
  emotion: string
  topic: string
  request: string
}
