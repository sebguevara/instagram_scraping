import type { ApifyProfileResponse, HistoryEntity, InstagramUserAccountEntity } from '@/interfaces'

/**
 * Maps Apify profile data to a HistoryEntity object.
 * @param {ApifyProfileResponse} item - The Apify profile data
 * @param {number} accountId - The ID of the account that owns the profile
 * @returns {HistoryEntity} The mapped history entity
 */
export const mapApifyProfileToUser = (
  item: ApifyProfileResponse,
  accountId: number
): HistoryEntity => {
  return {
    userName: item.username,
    followers: item.followersCount,
    following: item.followsCount,
    numberOfPosts: item.postsCount || 0,
    scrapDate: new Date(),
    accountId: accountId,
  } as HistoryEntity
}

/**
 * Maps a HistoryEntity object to an InstagramUserAccountEntity object.
 * @param {HistoryEntity} history - The history entity to map
 * @param {ApifyProfileResponse} profileData - The Apify profile data
 * @returns {InstagramUserAccountEntity} The mapped Instagram user account entity
 */
export const mapUserToPrisma = (
  history: HistoryEntity,
  profileData: ApifyProfileResponse
): InstagramUserAccountEntity => {
  return {
    followers: history.followers,
    following: history.following,
    username: history.userName,
    accountId: history.accountId,
    numberOfPosts: history.numberOfPosts,
    profilePictureUrl: profileData.profilePicUrl,
    scrapDate: history.scrapDate,
  } as InstagramUserAccountEntity
}
