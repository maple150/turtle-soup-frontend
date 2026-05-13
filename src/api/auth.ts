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
  email: string
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

function buildRegisterPayload(params: RegisterParams) {
  const safeUsername = params.username.trim()

  return {
    username: safeUsername,
    nickname: safeUsername,
    email: `${safeUsername}@placeholder.local`,
    password: params.password
  }
}

export function login(params: LoginParams) {
  return request.post<ApiResponse<LoginResult>>(
    '/auth/login',
    {
      account: params.username,
      password: params.password
    },
    {
      skipAuth: true
    }
  )
}

export function register(params: RegisterParams) {
  return request.post<ApiResponse<RegisterResult>>('/auth/register', buildRegisterPayload(params), {
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
