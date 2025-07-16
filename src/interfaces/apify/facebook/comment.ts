export interface ApifyFBCommentResponse {
  type: string
  comment_id: string
  legacy_comment_id: string
  depth: number
  created_time: number
  message: string
  author: Author
  replies_count: number
  reactions_count: string
  expansion_token: string
  scrapedAt: string
}

interface Author {
  id: string
  name: string
  gender: string
  url: null
}
