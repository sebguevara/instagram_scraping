export interface AccountEntity {
  id?: number
  accountURL: string
  accountType: string
  enabled: string
  instagram_user_account?: InstagramUserAccountEntity
}

export interface HistoryEntity {
  id?: number
  userName: string
  numberOfPosts: number
  followers: number
  following: number
  scrapDate: Date
  accountId: number
}

export interface InstagramUserAccountEntity {
  id?: number
  username: string
  followers: number
  following: number
  numberOfPosts: number
  accountId: number
  profilePictureUrl: string
  scrapDate: Date
}
