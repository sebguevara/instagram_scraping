import { prisma } from '@/config/prisma'
import { apifyClient } from '@/config/apify'
import { getUsername } from '@/utils/get_username'
import { APIFY_ACTORS } from '@/const'
import { mapApifyProfileToUserAccount } from '@/mappers/profile.mapper'
import type { ApifyProfileResponse } from '@/interfaces/profile'

export const getInstagramProfileData = async () => {
  const accounts = await prisma.account_entity.findMany({ where: { enabled: 'TRUE' } })
  const accountMap = new Map(
    accounts.map((account) => [getUsername(account.accountURL), account.id])
  )
  const { defaultDatasetId } = await apifyClient.actor(APIFY_ACTORS.PROFILE_ACTOR).call({
    usernames: Array.from(accountMap.keys()),
  })

  const { items } = await apifyClient.dataset(defaultDatasetId).listItems()
  const data = items as unknown as ApifyProfileResponse[]

  const historyEntities = data.map((item) =>
    mapApifyProfileToUserAccount(item, accountMap.get(item.username)!)
  )

  await prisma.history_entity.createMany({ data: historyEntities })
  return historyEntities
}
