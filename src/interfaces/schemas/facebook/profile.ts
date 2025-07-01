export interface FBUserAccountEntity {
  id?: number
  name: string
  username: string
  likes?: number
  followers: number
  profilePictureURL?: string
  publication_ammount: number
  last_scrap_date: Date
  accountEntityID: number
}

export interface FBHistoryEntity {
  id?: number
  scrap_date: Date
  username: string
  followers: number
  likes: number
  accountEntityID: number
}
