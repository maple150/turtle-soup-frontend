import request, { type ApiResponse } from './request'

export interface UserProfile {
  id: string
  username: string
  nickname: string
  email: string | null
  avatarUrl: string | null
  bio: string
  roles: string[]
  status: string
  createdAt: number
  updatedAt: number
}

export function getCurrentUserProfile() {
  return request.get<ApiResponse<UserProfile>>('/me')
}

export function updateCurrentUserProfile(params: {
  nickname?: string
  email?: string
  bio?: string
}) {
  return request.patch<ApiResponse<UserProfile>>('/me', params)
}
