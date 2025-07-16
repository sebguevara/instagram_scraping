export interface FBPostEntity {
  id?: number
  facebookPostID: string
  media: string
  title: string
  numberoflikes: number
  numberofshares: number
  numberofcomments: number
  scrapdate: Date
  postdate: Date
  type: 'POST' | 'REEL'
  link: string
  accountId: number
}
export interface FBPostAnalysisEntity {
  id?: number
  postTopicId?: number
  commentsAmmount?: number
  ammountNegativeComments?: number
  ammountPositiveComments?: number
  ammountNeutralComments?: number
  generalEmotion?: string
  postEngagement?: number
  tags?: string
  createdAt?: Date
  updatedAt?: Date
  facebookPostID: number
}
