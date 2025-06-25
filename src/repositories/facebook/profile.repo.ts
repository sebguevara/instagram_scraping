import { apifyClient, prisma } from '@/config'
import { APIFY_IG_ACTORS } from '@/const'
import type {
  AccountEntity,
  ApifyProfileResponse,
  HistoryEntity,
  InstagramUserAccountEntity,
} from '@/interfaces'
import { mapApifyProfileToUser, mapUserToPrisma } from '@/mappers'
import { getUsername } from '@/utils'

/**
 * Updates the accounts in the database.
 * @param {HistoryEntity[]} historyEntities - The history entities to update
 * @param {ApifyProfileResponse[]} dataApify - The data from Apify
 * @returns {Promise<InstagramUserAccountEntity[]>} The updated accounts
 */
export const updateAccounts = async (
  historyEntities: HistoryEntity[],
  dataApify: ApifyProfileResponse[]
): Promise<InstagramUserAccountEntity[]> => {
  const accounts = (await prisma.account_entity.findMany({
    where: { enabled: 'TRUE', accountType: 'INSTAGRAM' },
  })) as unknown as AccountEntity[]

  const accountUpdates = accounts.map((account) => {
    const history = historyEntities.find((history) => history.accountId === account.id)
    const profileData = dataApify.find((item) => item.username === getUsername(account.accountURL))
    return {
      where: { id: account.id },
      data: mapUserToPrisma(history!, profileData!),
    }
  })

  const updatedAccounts = (await Promise.all(
    accountUpdates.map((update) => prisma.instagram_user_account.update(update))
  )) as unknown as InstagramUserAccountEntity[]

  if (updatedAccounts.length <= 0) throw new Error('No accounts updated')

  return updatedAccounts
}

/**
 * Creates a history profile.
 * @returns {Promise<{ historyEntities: HistoryEntity[]; dataApify: ApifyProfileResponse[] }>} The history profile
 */
export const createHistoryProfiles = async (): Promise<{
  historyEntities: HistoryEntity[]
  dataApify: ApifyProfileResponse[]
}> => {
  const accounts = (await prisma.account_entity.findMany({
    where: { enabled: 'TRUE', accountType: 'INSTAGRAM' },
  })) as unknown as AccountEntity[]

  const accountMap = new Map(
    accounts.map((account) => [getUsername(account.accountURL), account.id])
  )
  const { defaultDatasetId } = await apifyClient.actor(APIFY_IG_ACTORS.PROFILE_ACTOR).call({
    usernames: Array.from(accountMap.keys()),
  })

  const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
  const data = items as unknown as ApifyProfileResponse[]

  if (data.length <= 0) throw new Error('No data found')
  const historyEntities = data.map((item) =>
    mapApifyProfileToUser(item, accountMap.get(item.username)!)
  )
  for (const historyEntity of historyEntities) {
    await prisma.history_entity.create({ data: historyEntity })
  }

  return { historyEntities, dataApify: data }
}
