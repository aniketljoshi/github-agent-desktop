import { TtlStore } from './ttl-store.js'

export interface OAuthStateValue {
  codeVerifier: string
  returnTo: string
}

export class OAuthStateStore extends TtlStore<OAuthStateValue> {}
