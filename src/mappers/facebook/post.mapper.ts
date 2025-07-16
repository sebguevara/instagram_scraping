import type { ApifyFBPostResponse } from '@/interfaces'
import type { FBPostEntity } from '@/interfaces/schemas/facebook/post'

/**
 * Maps Apify post data to a PostEntity object.
 * @param {ApifyFBPostResponse} item - The Apify post data
 * @param {number} accountId - The ID of the account that owns the post
 * @returns {Promise<PostEntity>} The mapped post entity
 */
export const mapApifyFBPostToPost = async (
  item: ApifyFBPostResponse,
  accountId: number
): Promise<FBPostEntity> => {
  return {
    media: item.link,
    title: item.text,
    numberoflikes: item.likes,
    numberofcomments: item.comments,
    numberofshares: item.shares,
    scrapdate: new Date(),
    type: item.isVideo ? 'REEL' : 'POST',
    link: item.url,
    facebookPostID: item.postId,
    postdate: new Date(item.timestamp),
    accountId: accountId,
  } as FBPostEntity
}
