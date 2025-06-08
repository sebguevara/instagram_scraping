import { createHistoryProfiles, updateAccounts } from '@/repositories/profile.repo'

/**
 * Service to create profile history and update accounts.
 * @returns {Promise<{accounts: number, status: string}>} - Returns the number of updated accounts and status.
 * @throws {Error} - Throws an error if no history profiles or accounts are found.
 */
export const createProfileHistory = async (): Promise<{ accounts: number; status: string }> => {
  const { historyEntities, dataApify } = await createHistoryProfiles()
  if (historyEntities.length <= 0) throw new Error('No history profiles found')

  const updatedAccounts = await updateAccounts(historyEntities, dataApify)
  if (updatedAccounts.length <= 0) throw new Error('No accounts updated')

  return {
    accounts: updatedAccounts.length,
    status: 'success',
  }
}
