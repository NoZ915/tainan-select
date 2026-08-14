import { User } from './userType'

export type AuthStatusResponse =
  | {
    authenticated: true
    session_scope: string
    user: User
  }
  | {
    authenticated: false
    user?: never
  }
