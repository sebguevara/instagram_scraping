import { apifyClient, prisma } from '@/config'
import { APIFY_ACTORS } from '@/const'
import { mapApifyProfileToUser, mapUserToPrisma } from '@/mappers'
import { getUsername } from '@/utils'
import type { AccountEntity, ApifyProfileResponse, HistoryEntity } from '@/interfaces'

export const createProfileHistory = async () => {
  const accounts = (await prisma.account_entity.findMany({
    where: { enabled: 'TRUE' },
  })) as unknown as AccountEntity[]

  const accountMap = new Map(
    accounts.map((account) => [getUsername(account.accountURL), account.id])
  )
  const { historyEntities, dataApify } = await createHistoryProfiles(accountMap)

  if (historyEntities.length <= 0) throw new Error('No history profiles found')

  const updatedAccounts = await updateAccounts(accounts, historyEntities, dataApify)

  return updatedAccounts
}

const updateAccounts = async (
  accounts: AccountEntity[],
  historyEntities: HistoryEntity[],
  dataApify: ApifyProfileResponse[]
) => {
  const accountUpdates = accounts.map((account) => {
    const history = historyEntities.find((history) => history.accountId === account.id)
    const profileData = dataApify.find((item) => item.username === getUsername(account.accountURL))
    return {
      where: { id: account.id },
      data: mapUserToPrisma(history!, profileData!),
    }
  })

  const updatedAccounts = await Promise.all(
    accountUpdates.map((update) => prisma.instagram_user_account.update(update))
  )

  if (updatedAccounts.length <= 0) throw new Error('No accounts updated')

  return updatedAccounts
}

const createHistoryProfiles = async (accountMap: Map<string | null, number | undefined>) => {
  const { defaultDatasetId } = await apifyClient.actor(APIFY_ACTORS.PROFILE_ACTOR).call({
    usernames: Array.from(accountMap.keys()),
  })

  const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
  const data = items as unknown as ApifyProfileResponse[]

  if (data.length <= 0) throw new Error('No data found')

  const historyEntities = data.map((item) =>
    mapApifyProfileToUser(item, accountMap.get(item.username)!)
  )
  await prisma.history_entity.createMany({
    data: historyEntities,
  })

  return { historyEntities, dataApify: data }
}
