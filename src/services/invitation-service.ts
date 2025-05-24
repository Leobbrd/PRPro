import { apiClient } from './api-client'
import {
  InvitationData,
  InvitationFormData,
  InvitationFilter,
  InvitationSort,
  Attendee
} from '@/types/invitation'
import { ApiResponse, PaginatedResponse } from '@/types/api'

/**
 * 招待状関連のAPIサービス
 */
class InvitationService {
  private readonly basePath = '/invitations'

  /**
   * 招待状一覧を取得する
   * @param options - フィルターとソート条件
   * @returns 招待状一覧
   */
  async getInvitations(options?: {
    filter?: InvitationFilter
    sort?: InvitationSort
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<InvitationData>> {
    const params = {
      ...options?.filter,
      sortField: options?.sort?.field,
      sortDirection: options?.sort?.direction,
      page: options?.page,
      limit: options?.limit,
    }

    return apiClient.get<InvitationData[]>(this.basePath, params)
  }

  /**
   * 招待状の詳細を取得する
   * @param id - 招待状ID
   * @returns 招待状詳細
   */
  async getInvitation(id: string): Promise<ApiResponse<InvitationData>> {
    return apiClient.get<InvitationData>(`${this.basePath}/${id}`)
  }

  /**
   * 新しい招待状を作成する
   * @param data - 招待状データ
   * @returns 作成された招待状
   */
  async createInvitation(data: InvitationFormData): Promise<ApiResponse<InvitationData>> {
    return apiClient.post<InvitationData>(this.basePath, data)
  }

  /**
   * 招待状を更新する
   * @param id - 招待状ID
   * @param data - 更新データ
   * @returns 更新された招待状
   */
  async updateInvitation(
    id: string,
    data: Partial<InvitationFormData>
  ): Promise<ApiResponse<InvitationData>> {
    return apiClient.put<InvitationData>(`${this.basePath}/${id}`, data)
  }

  /**
   * 招待状を削除する
   * @param id - 招待状ID
   * @returns 削除結果
   */
  async deleteInvitation(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.basePath}/${id}`)
  }

  /**
   * 招待状のステータスを更新する
   * @param id - 招待状ID
   * @param status - 新しいステータス
   * @returns 更新された招待状
   */
  async updateInvitationStatus(
    id: string,
    status: InvitationData['status']
  ): Promise<ApiResponse<InvitationData>> {
    return apiClient.put<InvitationData>(`${this.basePath}/${id}/status`, { status })
  }

  /**
   * 招待状の参加者一覧を取得する
   * @param invitationId - 招待状ID
   * @returns 参加者一覧
   */
  async getAttendees(invitationId: string): Promise<ApiResponse<Attendee[]>> {
    return apiClient.get<Attendee[]>(`${this.basePath}/${invitationId}/attendees`)
  }

  /**
   * 招待状に参加申込みする
   * @param invitationId - 招待状ID
   * @param attendeeData - 参加者情報
   * @returns 参加申込み結果
   */
  async registerAttendee(
    invitationId: string,
    attendeeData: Omit<Attendee, 'id' | 'invitationId' | 'registeredAt'>
  ): Promise<ApiResponse<Attendee>> {
    return apiClient.post<Attendee>(`${this.basePath}/${invitationId}/attendees`, attendeeData)
  }

  /**
   * 参加ステータスを更新する
   * @param invitationId - 招待状ID
   * @param attendeeId - 参加者ID
   * @param status - 新しいステータス
   * @returns 更新された参加者情報
   */
  async updateAttendeeStatus(
    invitationId: string,
    attendeeId: string,
    status: Attendee['status']
  ): Promise<ApiResponse<Attendee>> {
    return apiClient.put<Attendee>(
      `${this.basePath}/${invitationId}/attendees/${attendeeId}`,
      { status }
    )
  }
}

export const invitationService = new InvitationService()