import type { ApifyPostResponse, PostEntity } from '@/interfaces/post'

export const mapApifyPostToPost = (item: ApifyPostResponse, accountId: number) => {
  return {
    media: item.displayUrl,
    title: item.caption,
    numberOfLikes: item.likesCount,
    numberOfComments: item.commentsCount,
    scrapDate: new Date(),
    postDate: new Date(item.timestamp),
    type: item.type === 'Image' || item.type === 'Sidecar' ? 'POST' : 'REEL',
    link: item.url,
    accountId: accountId,
  } as PostEntity
}
