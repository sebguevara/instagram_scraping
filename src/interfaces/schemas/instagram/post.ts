import type { IGCommentAnalysisEntity } from './comment'

export interface IGPostEntity {
  id?: number
  media: string
  title: string
  numberOfLikes?: number
  numberOfComments?: number
  scrapDate: Date
  postDate: Date
  type: 'POST' | 'REEL'
  link?: string
  artificialLikes?: boolean
  accountId: number
}
export interface IGPostEntityWithAnalysis extends IGPostEntity {
  comment_analysis: IGCommentAnalysisEntity[]
}

export interface IGPostTopic {
  id: number
  topic: string
  description?: string
  emoji: string
  accountCategory?: 'POLITICS' | 'NEWS' | 'ALL'
  account_category_id?: number
  accountcategory?: string
}

export interface IGPostAnalysis {
  id?: number
  post_topic_id?: number
  instagram_post_id?: number
  post_date?: Date
  comments_amount?: number
  ammount_negative_comments?: number
  ammount_positive_comments?: number
  ammount_neutral_comments?: number
  general_emotion?: string
  post_engagement?: number
  tags?: string
  createdat?: Date
  updatedat?: Date
  avoid_actions?: string[]
  keep_doing_actions?: string[]
}

export interface IGPostTopicResponse {
  topic: string
  id: number
}
