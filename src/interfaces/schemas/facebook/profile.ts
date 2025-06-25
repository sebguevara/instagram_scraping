export interface FBUserAccountEntity {
  id?: number
  accountEntityID?: number
  name: string
  username: string
  likes?: number
  followers?: number
  profilePictureURL?: string
  publication_ammount?: number
  last_scrap_date?: Date
}

export interface FBAccountHistoryEntity {
  id?: number
  accountEntityID?: number
  scrap_date: Date
  username: string
  followers: number
  likes: number
}
