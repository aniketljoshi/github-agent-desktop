import { TtlStore } from './ttl-store.js'

export interface ExchangeGrant {
  accessToken: string
  authMethod: 'oauth'
  user: {
    username: string
    avatarUrl: string
  }
}

export class ExchangeGrantStore extends TtlStore<ExchangeGrant> {}
