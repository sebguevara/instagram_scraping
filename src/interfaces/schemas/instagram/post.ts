import type { IGCommentAnalysis } from './comment'

export interface IGPostEntity {
  id?: number
  media: string
  title: string
  numberOfLikes: number
  numberOfComments: number
  scrapDate: Date
  postDate: Date
  type: 'POST' | 'REEL'
  link: string
  artificialLikes: boolean
  numberOfViews: number
  accountId: number
}

export interface IGPostEntityWithRelations extends IGPostEntity {
  comment_analysis?: IGCommentAnalysis[]
  post_analysis?: IGPostAnalysis[]
}

export interface IGPostAnalysis {
  id?: number
  post_date: Date
  comments_amount?: number
  ammount_negative_comments?: number
  ammount_positive_comments?: number
  ammount_neutral_comments?: number
  general_emotion?: string
  post_engagement?: number
  createdat?: Date
  updatedat?: Date
  tags: string
  post_topic_id: number
  instagram_post_id: number
}
