import type { ApifyProfileResponse, HistoryEntity } from '@/interfaces/profile'

export const mapApifyProfileToUserAccount = (item: ApifyProfileResponse, accountId: number) => {
  return {
    userName: item.username,
    followers: item.followersCount,
    following: item.followsCount,
    numberOfPosts: item.postsCount || 0,
    scrapDate: new Date(),
    accountId: accountId,
  } as HistoryEntity
}
