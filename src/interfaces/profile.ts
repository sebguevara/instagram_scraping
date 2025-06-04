export interface AccountEntity {
  id?: number
  accountURL: string
  accountType: string
  enabled: string
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

export interface ApifyProfileResponse {
  inputUrl: string
  id: string
  username: string
  url: string
  fullName: string
  biography: string
  externalUrls: ExternalUrl[]
  externalUrl?: string
  externalUrlShimmed?: string
  followersCount: number
  followsCount: number
  hasChannel: boolean
  highlightReelCount: number
  isBusinessAccount: boolean
  joinedRecently: boolean
  businessCategoryName: string
  private: boolean
  verified: boolean
  profilePicUrl: string
  profilePicUrlHD: string
  igtvVideoCount: number
  relatedProfiles: RelatedProfile[]
  latestIgtvVideos: LatestIgtvVideo[]
  postsCount: number
  latestPosts: LatestPost[]
  fbid: string
  businessAddress?: BusinessAddress
}

interface BusinessAddress {
  city_name: string
  city_id: number
  latitude: number
  longitude: number
  street_address: null
  zip_code: string
}

interface LatestPost {
  id: string
  type: string
  shortCode: string
  caption: string
  hashtags: string[]
  mentions: string[]
  url: string
  commentsCount: number
  dimensionsHeight: number
  dimensionsWidth: number
  displayUrl: string
  images: string[]
  videoUrl?: string
  alt: null | string
  likesCount: number
  videoViewCount?: number
  timestamp: string
  childPosts: ChildPost[][]
  ownerUsername: string
  ownerId: string
  productType?: string
  isPinned?: boolean
  isCommentsDisabled: boolean
  locationName?: string
  locationId?: string
  taggedUsers?: TaggedUser[]
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
  latestComments: Comment[]
  dimensionsHeight: number
  dimensionsWidth: number
  displayUrl: string
  images: string[]
  alt: null | string | string
  likesCount: number
  timestamp: string
  childPosts: ChildPost[]
  ownerUsername: string
  ownerId: string
  taggedUsers?: TaggedUser[]
  videoUrl?: string
  videoViewCount?: number
}

interface LatestIgtvVideo {
  type: string
  shortCode: string
  title: string
  caption: string
  commentsCount: number
  commentsDisabled: boolean
  dimensionsHeight: number
  dimensionsWidth: number
  displayUrl: string
  likesCount: number
  videoDuration: number
  videoViewCount: number
  id: string
  hashtags: string[]
  mentions: string[]
  url: string
  firstComment: string
  latestComments: Comment[]
  images: string[]
  videoUrl: string
  alt: null
  timestamp: string
  childPosts: ChildPost[]
  locationName?: string
  locationId?: string
  ownerUsername: string
  ownerId: string
  productType: string
  isCommentsDisabled: boolean
  taggedUsers?: TaggedUser[]
}

interface TaggedUser {
  full_name: string
  id: string
  is_verified: boolean
  profile_pic_url: string
  username: string
}

interface RelatedProfile {
  id: string
  full_name: string
  is_private: boolean
  is_verified: boolean
  profile_pic_url: string
  username: string
}

interface ExternalUrl {
  title: string
  lynx_url: string
  url: string
  link_type: string
}
