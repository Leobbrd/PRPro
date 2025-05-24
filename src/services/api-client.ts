import { ApiResponse, ApiError } from '@/types/api'
import { API_CONFIG } from '@/lib/constants'

/**
 * APIクライアントクラス
 * HTTP通信の共通処理を提供する
 */
class ApiClient {
  private baseURL: string
  private timeout: number

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  /**
   * HTTP GETリクエストを送信する
   * @param endpoint - APIエンドポイント
   * @param params - クエリパラメータ
   * @returns APIレスポンス
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseURL)
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]))
        }
      })
    }

    return this.request<T>(url.toString(), {
      method: 'GET',
    })
  }

  /**
   * HTTP POSTリクエストを送信する
   * @param endpoint - APIエンドポイント
   * @param data - リクエストボディ
   * @returns APIレスポンス
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * HTTP PUTリクエストを送信する
   * @param endpoint - APIエンドポイント
   * @param data - リクエストボディ
   * @returns APIレスポンス
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * HTTP DELETEリクエストを送信する
   * @param endpoint - APIエンドポイント
   * @returns APIレスポンス
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
    })
  }

  /**
   * HTTP リクエストを送信する共通処理
   * @param url - リクエストURL
   * @param options - フェッチオプション
   * @returns APIレスポンス
   */
  private async request<T>(url: string, options: RequestInit): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          ...this.getAuthHeaders(),
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw await this.handleErrorResponse(response)
      }

      const data = await response.json()
      return data as ApiResponse<T>
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('リクエストがタイムアウトしました')
      }
      
      throw error
    }
  }

  /**
   * 認証ヘッダーを取得する
   * @returns 認証ヘッダー
   */
  private getAuthHeaders(): Record<string, string> {
    // TODO: 実際の認証実装時に実装
    // const token = localStorage.getItem('authToken')
    // return token ? { Authorization: `Bearer ${token}` } : {}
    return {}
  }

  /**
   * エラーレスポンスを処理する
   * @param response - フェッチレスポンス
   * @returns エラーオブジェクト
   */
  private async handleErrorResponse(response: Response): Promise<Error> {
    try {
      const errorData: ApiError = await response.json()
      return new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    } catch {
      return new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }
}

export const apiClient = new ApiClient()