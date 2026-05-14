import request, { type ApiResponse } from './request'

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
  userId: string
}

export interface RegisterParams {
  username: string
  password: string
}

export interface RegisterResult {
  userId: string
  username: string
  nickname: string
  email: string | null
}

export interface RefreshTokenParams {
  refreshToken: string
}

export interface RefreshTokenResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export interface LogoutParams {
  refreshToken?: string
}

export function login(params: LoginParams) {
  return request.post<ApiResponse<LoginResult>>(
    '/auth/login',
    {
      username: params.username,
      password: params.password
    },
    {
      skipAuth: true
    }
  )
}

export function register(params: RegisterParams) {
  return request.post<ApiResponse<RegisterResult>>('/auth/register', params, {
    skipAuth: true
  })
}

export function refreshToken(params: RefreshTokenParams) {
  return request.post<ApiResponse<RefreshTokenResult>>('/auth/refresh', params, {
    skipAuth: true
  })
}

export function logout(params?: LogoutParams) {
  return request.post<ApiResponse<{ ok: true }>>('/auth/logout', params)
}
