export interface ApifyIGPostResponse {
  inputUrl: string
  id: string
  type: string
  shortCode: string
  caption: string
  hashtags: string[]
  mentions: string[]
  url: string
  commentsCount: number
  firstComment: string
  latestComments: LatestComment[]
  dimensionsHeight: number
  dimensionsWidth: number
  displayUrl: string
  images: string[]
  alt: null | string
  likesCount: number
  timestamp: string
  childPosts: ChildPost[]
  locationName: string
  locationId: string
  ownerFullName: string
  ownerUsername: string
  ownerId: string
  isSponsored: boolean
  taggedUsers?: TaggedUser[]
  isCommentsDisabled: boolean
  videoUrl?: string
  videoViewCount?: number
  videoPlayCount?: number
  productType?: string
  videoDuration?: number
  musicInfo?: MusicInfo
}

interface MusicInfo {
  artist_name: string
  song_name: string
  uses_original_audio: boolean
  should_mute_audio: boolean
  should_mute_audio_reason: string
  audio_id: string
}

interface ChildPost {
  id: string
  type: string
  shortCode: string
  caption: string
  hashtags: string[]
  mentions: string[]
  url: string
  commentsCount: number
  firstComment: string
  latestComments: LatestComment[]
  dimensionsHeight: number
  dimensionsWidth: number
  displayUrl: string
  images: string[]
  alt: string
  likesCount: null
  timestamp: null
  childPosts: ChildPost[]
  ownerId: null
  taggedUsers?: TaggedUser[]
}

interface TaggedUser {
  full_name: string
  id: string
  is_verified: boolean
  profile_pic_url: string
  username: string
}

interface LatestComment {
  id: string
  text: string
  ownerUsername: string
  ownerProfilePicUrl: string
  timestamp: string
  repliesCount: number
  replies: LatestComment[]
  likesCount: number
  owner: Owner
}

interface Owner {
  id: string
  is_verified: boolean
  profile_pic_url: string
  username: string
}
