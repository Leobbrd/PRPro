import { apiClient } from './api-client'
import { User, UserAuth, UserProfileData } from '@/types/user'
import { ApiResponse } from '@/types/api'

/**
 * ユーザー関連のAPIサービス
 */
class UserService {
  private readonly basePath = '/users'

  /**
   * ユーザー登録
   * @param userData - ユーザー登録データ
   * @returns 認証情報
   */
  async register(userData: {
    name: string
    email: string
    password: string
  }): Promise<ApiResponse<UserAuth>> {
    return apiClient.post<UserAuth>('/auth/register', userData)
  }

  /**
   * ユーザーログイン
   * @param credentials - ログイン情報
   * @returns 認証情報
   */
  async login(credentials: {
    email: string
    password: string
  }): Promise<ApiResponse<UserAuth>> {
    return apiClient.post<UserAuth>('/auth/login', credentials)
  }

  /**
   * ユーザーログアウト
   * @returns ログアウト結果
   */
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/logout')
  }

  /**
   * 現在のユーザー情報を取得
   * @returns ユーザー情報
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me')
  }

  /**
   * ユーザープロフィールを更新
   * @param data - 更新データ
   * @returns 更新されたユーザー情報
   */
  async updateProfile(data: UserProfileData): Promise<ApiResponse<User>> {
    return apiClient.put<User>(`${this.basePath}/profile`, data)
  }

  /**
   * パスワードを変更
   * @param data - パスワード変更データ
   * @returns 変更結果
   */
  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<ApiResponse<void>> {
    return apiClient.put<void>(`${this.basePath}/password`, data)
  }

  /**
   * パスワードリセット要求
   * @param email - メールアドレス
   * @returns リセット要求結果
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/password-reset', { email })
  }

  /**
   * パスワードリセット実行
   * @param data - リセットデータ
   * @returns リセット結果
   */
  async resetPassword(data: {
    token: string
    newPassword: string
  }): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/password-reset/confirm', data)
  }

  /**
   * ユーザーアカウントを削除
   * @returns 削除結果
   */
  async deleteAccount(): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.basePath}/account`)
  }
}

export const userService = new UserService()