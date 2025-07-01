import type { FBUserAccountEntity } from '../facebook/profile'
import type { IGUserAccountEntity } from '../instagram/profile'

export interface AccountEntity {
  id?: number
  accountURL: string
  enabled: 'TRUE' | 'FALSE'
  account_type_id: number
  account_category_id: number
  main_entity_id: number
}

export interface AccountEntityWithRelations extends AccountEntity {
  instagram_user_account?: IGUserAccountEntity
  facebook_user_account?: FBUserAccountEntity
}

export interface MainEntity {
  id?: number
  name: string
  description?: string
  account_category_id?: number
  createdat?: Date
}

export interface AccountType {
  id?: number
  name: 'INSTAGRAM' | 'FACEBOOK'
  description?: string
  createdat?: Date
}

export interface AccountCategory {
  id?: number
  name: 'POLITICS' | 'NEWS' | 'ALL'
  description?: string
  createdat?: Date
}
