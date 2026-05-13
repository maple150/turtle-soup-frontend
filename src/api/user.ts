import request, { type ApiResponse } from './request'

export interface UserProfile {
  id: string
  username: string
  nickname: string
  email: string
  avatarUrl: string | null
  bio: string
  roles: string[]
  createdAt: number
  updatedAt: number
}

export function getCurrentUserProfile() {
  return request.get<ApiResponse<UserProfile>>('/me')
}
