/**
 * 招待状の基本データ型
 */
export interface InvitationData {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  maxAttendees: number
  currentAttendees: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
  status: InvitationStatus
}

/**
 * 招待状フォームのデータ型
 */
export interface InvitationFormData {
  title: string
  description: string
  date: string
  time: string
  location: string
  maxAttendees: number
}

/**
 * 招待状のステータス
 */
export type InvitationStatus = 'draft' | 'published' | 'cancelled' | 'completed'

/**
 * 参加者データ型
 */
export interface Attendee {
  id: string
  invitationId: string
  name: string
  email: string
  status: AttendeeStatus
  message?: string
  registeredAt: Date
}

/**
 * 参加者のステータス
 */
export type AttendeeStatus = 'pending' | 'accepted' | 'declined' | 'maybe'

/**
 * 招待状一覧のフィルター条件
 */
export interface InvitationFilter {
  status?: InvitationStatus
  dateFrom?: string
  dateTo?: string
  search?: string
}

/**
 * 招待状一覧のソート条件
 */
export interface InvitationSort {
  field: 'date' | 'title' | 'createdAt' | 'updatedAt'
  direction: 'asc' | 'desc'
}