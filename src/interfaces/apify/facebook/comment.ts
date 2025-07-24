// export interface ApifyFBCommentResponse {
//   type: string
//   comment_id: string
//   legacy_comment_id: string
//   depth: number
//   created_time: number
//   message: string
//   author: Author
//   replies_count: number
//   reactions_count: string
//   expansion_token: string
//   scrapedAt: string
// }

// interface Author {
//   id: string
//   name: string
//   gender: string
//   url: null
// }

export interface ApifyFBCommentResponse {
  facebookUrl: string
  commentUrl: string
  id: string
  feedbackId: string
  date: string
  text: string
  profilePicture: string
  profileId: string
  profileName: string
  likesCount: string
  threadingDepth: number
  facebookId: string
  postTitle: string
  pageAdLibrary: PageAdLibrary
  inputUrl: string
  profileUrl?: string
  error?: string
}

interface PageAdLibrary {
  id: string
  woodhenge_creator_info: null
}
