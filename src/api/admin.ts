import request, { type ApiResponse, type PaginatedData } from './request'
import type { RoomSummary } from './room'
import type { SoupDetail } from './soup'
import type { UserProfile } from './user'

export interface AdminOverview {
  enabled: boolean
  totals: {
    users: number
    soups: number
    rooms: number
  }
  aiEnabled: boolean
  aiModel: string
}

export interface AiConfig {
  enabled: boolean
  provider: string
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  temperature: number
  maxTokens: number
}

export interface AdminUser extends UserProfile {
  status: 'active' | 'blocked' | 'deleted'
}

export interface AdminSoup extends SoupDetail {
  status: 'draft' | 'published' | 'archived'
  isPublic?: boolean
}

export interface AdminRoom extends RoomSummary {
  status: 'waiting' | 'playing' | 'revealed' | 'finished'
}

export interface AdminSoupImportItem {
  title: string
  subtitle?: string
  description: string
  content: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
  isPublic?: boolean
}

export function getAdminOverview() {
  return request.get<ApiResponse<AdminOverview>>('/admin/overview')
}

export function getAdminUsers(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request.get<ApiResponse<PaginatedData<AdminUser>>>('/admin/users', { params })
}

export function createAdminUser(params: {
  username: string
  password: string
  nickname?: string
  email?: string
  bio?: string
  roles?: string[]
  status?: 'active' | 'blocked' | 'deleted'
}) {
  return request.post<ApiResponse<UserProfile>>('/admin/users', params)
}

export function updateAdminUser(
  userId: string,
  params: {
    nickname?: string
    email?: string
    bio?: string
    roles?: string[]
    status?: 'active' | 'blocked' | 'deleted'
  }
) {
  return request.patch<ApiResponse<UserProfile>>(`/admin/users/${userId}`, params)
}

export function deleteAdminUser(userId: string) {
  return request.delete<ApiResponse<{ userId: string; deleted: true }>>(`/admin/users/${userId}`)
}

export function getAdminSoups(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request.get<ApiResponse<PaginatedData<AdminSoup>>>('/admin/soups', { params })
}

export function updateAdminSoup(
  soupId: string,
  params: Partial<{
    title: string
    subtitle: string
    description: string
    content: string
    answer: string
    difficulty: 'easy' | 'medium' | 'hard'
    tags: string[]
    status: 'draft' | 'published' | 'archived'
    isPublic: boolean
  }>
) {
  return request.patch<ApiResponse<SoupDetail>>(`/admin/soups/${soupId}`, params)
}

export function deleteAdminSoup(soupId: string) {
  return request.delete<ApiResponse<{ soupId: string; deleted: true }>>(`/admin/soups/${soupId}`)
}

export function importAdminSoups(items: AdminSoupImportItem[]) {
  return request.post<ApiResponse<{ importedCount: number; items: Array<{ id: string; title: string }> }>>(
    '/admin/soups/import',
    { items }
  )
}

export function getAdminRooms(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request.get<ApiResponse<PaginatedData<AdminRoom>>>('/admin/rooms', { params })
}

export function updateAdminRoom(
  roomCode: string,
  params: Partial<{
    name: string
    description: string
    status: 'waiting' | 'playing' | 'revealed' | 'finished'
    capacity: number
  }>
) {
  return request.patch<ApiResponse<RoomSummary>>(`/admin/rooms/${roomCode}`, params)
}

export function deleteAdminRoom(roomCode: string) {
  return request.delete<ApiResponse<{ roomCode: string; deleted: true }>>(`/admin/rooms/${roomCode}`)
}

export function getAdminAiConfig() {
  return request.get<ApiResponse<AiConfig>>('/admin/ai-config')
}

export function updateAdminAiConfig(params: AiConfig) {
  return request.put<ApiResponse<AiConfig>>('/admin/ai-config', params)
}

export function testAdminAiConfig(params: AiConfig) {
  return request.post<ApiResponse<{
    reachable: boolean
    model: string
    provider: string
    latencyMs: number
    preview: string | null
    statusCode?: number
    errorMessage?: string
  }>>('/admin/ai-config/test', params)
}
