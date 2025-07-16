export interface ApifyFBProfileResponse {
  facebookUrl: string
  categories: string[]
  info: string[]
  likes: number
  messenger: null
  title: string
  address: string
  pageId: string
  pageName: string
  pageUrl: string
  intro: string
  websites: string[]
  email: string
  alternativeSocialMedia: string
  website: string
  followers: number
  followings: number
  profilePictureUrl: string
  coverPhotoUrl: string
  profilePhoto: string
  creation_date: string
  ad_status: string
  facebookId: string
  pageAdLibrary: PageAdLibrary
}

interface PageAdLibrary {
  is_business_page_active: boolean
  id: string
}
