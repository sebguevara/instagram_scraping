export interface IGAccountEntity {
  id?: number
  accountURL: string
  accountType: string
  enabled: 'TRUE' | 'FALSE'
  accountCategory?: IGAccountCategoryEntity
  account_type_id?: number
  account_category_id?: number
  accounttype?: IGAccountTypeCategoryEntity
  accountcategory?: IGAccountTypeCategoryEntity
  instagram_user_account?: IGInstagramUserAccountEntity
}

export interface IGAccountTypeCategoryEntity {
  id?: number
  name: string
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
