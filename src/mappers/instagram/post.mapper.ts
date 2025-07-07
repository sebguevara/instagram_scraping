import type { ApifyIGPostResponse, IGPostEntity } from '@/interfaces'
import { calculateLikes } from '@/utils'

/**
 * Maps Apify post data to a PostEntity object.
 * @param {ApifyPostResponse} item - The Apify post data
 * @param {number} accountId - The ID of the account that owns the post
 * @returns {Promise<PostEntity>} The mapped post entity
 */
export const mapApifyPostToPost = async (
  item: ApifyIGPostResponse,
  accountId: number
): Promise<IGPostEntity> => {
  const likes = item.likesCount != -1 ? item.likesCount : await calculateLikes(accountId)
  return {
    media: item.displayUrl,
    title: item.caption,
    numberOfLikes: likes,
    numberOfComments: item.commentsCount,
    scrapDate: new Date(),
    postDate: new Date(item.timestamp),
    type: item.type === 'Image' || item.type === 'Sidecar' ? 'POST' : 'REEL',
    link: item.url,
    accountId: accountId,
    artificialLikes: item.likesCount === -1,
    numberOfViews: item.videoPlayCount,
  } as IGPostEntity
}
