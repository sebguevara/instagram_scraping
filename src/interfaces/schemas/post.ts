import type { CommentAnalysisEntity } from './comment'

export interface PostEntity {
  id?: number
  media: string
  title: string
  numberOfLikes: number
  numberOfComments: number
  scrapDate: Date
  postDate: Date
  type: 'POST' | 'REEL'
  link: string
  accountId: number
}
export interface PostEntityWithAnalysis extends PostEntity {
  comment_analysis: CommentAnalysisEntity[]
}

export interface PostTopic {
  id: number
  topic: string
  description: string
  emoji: string
}

export interface PostAnalysis {
  id?: number
  post_topic_id: number
  instagram_post_id: number
  post_date: Date
  comments_amount?: number
  ammount_negative_comments?: number
  ammount_positive_comments?: number
  ammount_neutral_comments?: number
  general_emotion?: string
  post_engagement?: number
  createdat?: Date
  updatedat?: Date
}

export interface PostTopicResponse {
  topic: string
  id: number
}
