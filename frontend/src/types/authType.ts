import { User } from './userType'

export interface AuthStatusResponse{
    authenticated: boolean,
    user: User
}