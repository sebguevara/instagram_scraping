export interface IGAccountEntity {
  id?: number
  accountURL: string
  enabled: 'TRUE' | 'FALSE'
  account_type_id?: number
  account_category_id?: number
  accounttype?: IGAccountTypeEntity
  accountcategory?: IGAccountCategoryEntity
  instagram_user_account?: IGInstagramUserAccountEntity
}

export interface IGAccountTypeEntity {
  id?: number
  name: 'INSTAGRAM' | 'FACEBOOK'
  description?: string
  createdat?: Date
}

export interface IGAccountCategoryEntity {
  id?: number
  name: 'POLITICS' | 'NEWS' | 'ALL'
  description?: string
  createdat?: Date
}

export interface IGHistoryEntity {
  id?: number
  userName: string
  numberOfPosts: number
  followers: number
  following: number
  scrapDate: Date
  accountId: number
}

export interface IGInstagramUserAccountEntity {
  id?: number
  username: string
  followers: number
  following: number
  numberOfPosts: number
  accountId?: number
  profilePictureUrl?: string
  scrapDate: Date
  linksPosts?: string[]
}
