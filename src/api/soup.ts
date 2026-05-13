import request, {
  type ApiResponse,
  type PaginatedData,
  type PaginationParams
} from './request'

export type SoupDifficulty = 'easy' | 'medium' | 'hard'

export interface SoupSummary {
  id: string
  title: string
  subtitle: string | null
  description: string
  difficulty: SoupDifficulty
  tags: string[]
  favoriteCount: number
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface SoupDetail extends SoupSummary {
  content: string
  answer: string
}

export interface SoupListParams extends PaginationParams {
  keyword?: string
  difficulty?: SoupDifficulty
}

export interface CreateSoupParams {
  title: string
  subtitle?: string
  description: string
  difficulty: SoupDifficulty
  content: string
  answer: string
  tags?: string[]
}

export function getSoupList(params?: SoupListParams) {
  return request.get<ApiResponse<PaginatedData<SoupSummary>>>('/soups', {
    params
  })
}

export function getSoupDetail(soupId: string) {
  return request.get<ApiResponse<SoupDetail>>(`/soups/${soupId}`)
}

export function createSoup(params: CreateSoupParams) {
  return request.post<ApiResponse<SoupDetail>>('/soups', params)
}

export function favoriteSoup(soupId: string) {
  return request.post<ApiResponse<{ soupId: string; favorited: true }>>(`/soups/${soupId}/favorite`)
}

export function unfavoriteSoup(soupId: string) {
  return request.delete<ApiResponse<undefined>>(`/soups/${soupId}/favorite`)
}
