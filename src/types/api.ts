/**
 * API共通レスポンス型
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo
}

/**
 * APIエラー情報
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

/**
 * リクエストの共通パラメータ
 */
export interface BaseRequestParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}