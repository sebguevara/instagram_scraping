import type { ApifyProfileResponse, HistoryEntity } from '@/interfaces/profile'

export const mapApifyProfileToUser = (item: ApifyProfileResponse, accountId: number) => {
  return {
    userName: item.username,
    followers: item.followersCount,
    following: item.followsCount,
    numberOfPosts: item.postsCount || 0,
    scrapDate: new Date(),
    accountId: accountId,
  } as HistoryEntity
}

export const mapUserToPrisma = (history: HistoryEntity, profileData: ApifyProfileResponse) => {
  return {
    followers: history.followers,
    following: history.following,
    numberOfPosts: history.numberOfPosts,
    profilePictureUrl: profileData.profilePicUrl,
    scrapDate: history.scrapDate,
  }
}
