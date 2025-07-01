export interface FBPostEntity {
  id?: number
  media?: string
  title?: string
  numberoflikes?: number
  numberofshares?: number
  numberofcomments?: number
  scrapdate?: Date
  postdate: Date
  type?: string
  link?: string
  accountid: number
}

export interface FBPostTopic {
  id: number
  topic: string
  description?: string
  emoji: string
  accountCategory?: 'POLITICS' | 'NEWS' | 'ALL'
  account_category_id?: number
  accountcategory?: string
}

export interface FBPostAnalysisEntity {
  id?: number
  postTopicId: number
  commentsAmmount: number
  ammountNegativeComments: number
  ammountPositiveComments: number
  ammountNeutralComments: number
  generalEmotion: string
  postEngagement: number
  createdAt?: Date
  updatedAt?: Date
  instagramPostID: number
}
