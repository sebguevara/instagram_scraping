import type { ApifyFBProfileResponse, FBHistoryEntity, FBUserAccountEntity } from '@/interfaces'

/**
 * Maps Apify profile data to a HistoryEntity object.
 * @param {ApifyProfileResponse} item - The Apify profile data
 * @param {number} accountId - The ID of the account that owns the profile
 * @returns {HistoryEntity} The mapped history entity
 */
export const mapApifyFBProfileToUser = (
  item: ApifyFBProfileResponse,
  accountId: number
): FBHistoryEntity => {
  return {
    username: item.pageName,
    followers: Number(item.followers ?? -1),
    likes: item.likes ?? -1,
    scrap_date: new Date(),
    accountEntityID: accountId,
  } as FBHistoryEntity
}

/**
 * Maps a HistoryEntity object to an InstagramUserAccountEntity object.
 * @param {HistoryEntity} history - The history entity to map
 * @param {ApifyProfileResponse} profileData - The Apify profile data
 * @returns {InstagramUserAccountEntity} The mapped Instagram user account entity
 */
export const mapFBUserToPrisma = (
  history: FBHistoryEntity,
  profileData: ApifyFBProfileResponse
): FBUserAccountEntity => {
  return {
    profilePictureURL: profileData.profilePictureUrl,
    followers: history.followers ?? -1,
    likes: history.likes ?? -1,
    publication_ammount: 0,
    last_scrap_date: history.scrap_date,
    accountEntityID: history.accountEntityID,
  } as FBUserAccountEntity
}
