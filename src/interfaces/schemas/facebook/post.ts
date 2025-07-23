export interface FBPostEntity {
  id?: number
  facebookPostID: string
  media: string | null
  title: string
  numberoflikes: number
  numberofshares: number
  numberofcomments: number
  scrapdate: Date
  postdate: Date
  type: 'POST' | 'REEL'
  link: string
  accountid: number
}
export interface FBPostAnalysisEntity {
  id?: number
  post_topic_id?: number
  commentsAmmount?: number
  ammountNegativeComments?: number
  ammountPositiveComments?: number
  ammountNeutralComments?: number
  generalEmotion?: string
  postEngagement?: number
  tags?: string
  createdAt?: Date
  updatedAt?: Date
  postID: number
}
