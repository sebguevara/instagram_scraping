export interface IGHistoryEntity {
  id?: number
  userName: string
  numberOfPosts: number
  followers: number
  following: number
  scrapDate: Date
  accountId: number
}

export interface IGUserAccountEntity {
  id?: number
  username: string
  followers: number
  following: number
  numberOfPosts: number
  profilePictureUrl?: string
  scrapDate: Date
  linksPosts?: string[]
  accountId: number
}
