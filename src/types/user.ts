/**
 * ユーザーの基本データ型
 */
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * ユーザー認証情報
 */
export interface UserAuth {
  user: User
  accessToken: string
  refreshToken: string
}

/**
 * ユーザープロフィール更新用データ型
 */
export interface UserProfileData {
  name: string
  email: string
  avatar?: string
}