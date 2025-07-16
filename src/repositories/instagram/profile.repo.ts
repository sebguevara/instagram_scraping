import { apifyClient, prisma } from '@/config'
import { APIFY_IG_ACTORS } from '@/const'
import type {
  AccountEntityWithRelations,
  ApifyIGProfileResponse,
  IGHistoryEntity,
  IGUserAccountEntity,
} from '@/interfaces'
import { mapApifyProfileToUser, mapUserToPrisma } from '@/mappers'
import { getUsername } from '@/utils'

/**
 * Updates the accounts in the database.
 * @param {HistoryEntity[]} historyEntities - The history entities to update
 * @param {ApifyProfileResponse[]} dataApify - The data from Apify
 * @returns {Promise<IGUserAccountEntity[]>} The updated accounts
 */
export const updateAccounts = async (
  historyEntities: IGHistoryEntity[],
  dataApify: ApifyIGProfileResponse[]
): Promise<IGUserAccountEntity[]> => {
  const accounts = (await prisma.account_entity.findMany({
    where: { enabled: 'TRUE', account_type_id: 1 },
    include: { instagram_user_account: true },
  })) as unknown as AccountEntityWithRelations[]

  const accountUpdates = accounts.map((account) => {
    const history = historyEntities.find((history) => history.accountId === account.id)
    if (!history) return null

    const profileData = dataApify.find((item) => item.username === getUsername(account.accountURL))
    return {
      where: { id: account.instagram_user_account?.id },
      data: mapUserToPrisma(history, profileData!),
    }
  })
  const filteredAccountUpdates = accountUpdates.filter((update) => update !== null)

  const updatedAccounts = (await Promise.all(
    filteredAccountUpdates.map((update) => prisma.instagram_user_account.update(update))
  )) as unknown as IGUserAccountEntity[]

  if (updatedAccounts.length <= 0) throw new Error('No accounts updated')

  return updatedAccounts
}

/**
 * Creates a history profile.
 * @returns {Promise<{ historyEntities: HistoryEntity[]; dataApify: ApifyProfileResponse[] }>} The history profile
 */
export const createHistoryProfiles = async (): Promise<{
  historyEntities: IGHistoryEntity[]
  dataApify: ApifyIGProfileResponse[]
}> => {
  const accounts = (await prisma.account_entity.findMany({
    where: { enabled: 'TRUE', account_type_id: 1 },
    include: { instagram_user_account: true },
  })) as unknown as AccountEntityWithRelations[]

  const accountMap = new Map(
    accounts.map((account) => [getUsername(account.accountURL), account.id])
  )
  const { defaultDatasetId } = await apifyClient.actor(APIFY_IG_ACTORS.PROFILE_ACTOR).call({
    usernames: Array.from(accountMap.keys()),
  })

  const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
  const data = items as unknown as ApifyIGProfileResponse[]

  if (data.length <= 0) throw new Error('No data found')
  const historyEntities = data.map((item) =>
    mapApifyProfileToUser(item, accountMap.get(item.username)!)
  )
  for (const historyEntity of historyEntities) {
    await prisma.history_entity.create({ data: historyEntity })
  }

  return { historyEntities, dataApify: data }
}
