export interface ApifyIGCommentResponse {
  postId: string
  id: string
  userId: number
  message: string
  createdAt: number
  shareEnabled: boolean
  user: User
  isRanked: boolean
  likeCount: number
  noResults?: boolean
}

interface User {
  id: number
  username: string
  image: string
  isVerified: boolean
}
