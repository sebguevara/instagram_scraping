import { apifyClient, prisma } from '@/config'
import type {
  AccountEntity,
  AccountEntityWithRelations,
  ApifyFBProfileResponse,
} from '@/interfaces'
import type { FBHistoryEntity, FBUserAccountEntity } from '@/interfaces/schemas/facebook/profile'
import { mapApifyFBProfileToUser, mapFBUserToPrisma } from '@/mappers'
import { APIFY_FB_ACTORS } from '@/const'

/**
 * Updates the accounts in the database.
 * @param {HistoryEntity[]} historyEntities - The history entities to update
 * @param {ApifyProfileResponse[]} dataApify - The data from Apify
 * @returns {Promise<InstagramUserAccountEntity[]>} The updated accounts
 */
export const updateAccounts = async (
  historyEntities: FBHistoryEntity[],
  dataApify: ApifyFBProfileResponse[]
): Promise<FBUserAccountEntity[]> => {
  const accounts = (await prisma.account_entity.findMany({
    where: { enabled: 'TRUE', account_type_id: 2 },
    include: { facebook_user_account: true },
  })) as unknown as AccountEntityWithRelations[]

  const accountUpdates = accounts.map((account) => {
    const history = historyEntities.find((history) => history.accountEntityID === account.id)
    const profileData = dataApify.find((item) => item.facebookUrl === account.accountURL)
    if (!history || !profileData) return null
    return {
      where: { id: account.facebook_user_account?.id },
      data: mapFBUserToPrisma(history, profileData),
    }
  })
  const filteredAccountUpdates = accountUpdates.filter((update) => update !== null)

  const updatedAccounts = (await Promise.all(
    filteredAccountUpdates.map((update) => prisma.facebook_user_account.update(update))
  )) as unknown as FBUserAccountEntity[]

  return updatedAccounts
}

/**
 * Creates a history profile.
 * @returns {Promise<{ historyEntities: HistoryEntity[]; dataApify: ApifyProfileResponse[] }>} The history profile
 */
export const createHistoryProfiles = async (): Promise<{
  historyEntities: FBHistoryEntity[]
  dataApify: ApifyFBProfileResponse[]
}> => {
  const accounts = (await prisma.account_entity.findMany({
    where: { enabled: 'TRUE', account_type_id: 2 },
  })) as unknown as AccountEntity[]

  const accountMap = new Map(accounts.map((account) => [account.accountURL, account.id]))
  const { defaultDatasetId } = await apifyClient.actor(APIFY_FB_ACTORS.PROFILE_ACTOR).call({
    startUrls: accounts.map((account) => ({ url: account.accountURL, method: 'GET' })),
  })

  const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
  const data = items as unknown as ApifyFBProfileResponse[]

  if (data.length <= 0) throw new Error('No data found')
  const historyEntities = data.map((item) =>
    mapApifyFBProfileToUser(item, accountMap.get(item.facebookUrl)!)
  )
  for (const historyEntity of historyEntities) {
    await prisma.facebook_account_history.create({ data: historyEntity })
  }

  return { historyEntities, dataApify: data }
}
