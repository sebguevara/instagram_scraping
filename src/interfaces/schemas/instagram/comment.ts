export interface IGCommentEntity {
  id?: number
  comment: string
  commentOwnerName: string
  likesOfComment: number
  scrapDate: Date
  commentDate: Date
  originalCommentId?: number
  instagramid?: string
  postId: number
}

export interface IGCommentAnalysis {
  id?: number
  emotion: string
  topic: string
  request: string
  analyzedat?: Date
  updatedat?: Date
  comment_entity_id: number
  post_id: number
}

export interface IGCommentAnalysisRequest {
  emotion: string
  topic: string
  request: string
}
