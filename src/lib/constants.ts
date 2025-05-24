/**
 * アプリケーション定数
 */

/**
 * API関連の定数
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: 10000, // 10秒
  RETRY_COUNT: 3,
} as const

/**
 * ページネーションの定数
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
} as const

/**
 * 招待状関連の定数
 */
export const INVITATION_LIMITS = {
  MIN_TITLE_LENGTH: 1,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_ATTENDEES: 1,
  MAX_ATTENDEES: 1000,
} as const

/**
 * ファイルアップロード関連の定数
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const

/**
 * 招待状ステータスの表示名
 */
export const INVITATION_STATUS_LABELS = {
  draft: '下書き',
  published: '公開中',
  cancelled: 'キャンセル',
  completed: '完了',
} as const

/**
 * 参加者ステータスの表示名
 */
export const ATTENDEE_STATUS_LABELS = {
  pending: '未回答',
  accepted: '参加',
  declined: '不参加',
  maybe: '未定',
} as const

/**
 * 招待状ステータスのカラー
 */
export const INVITATION_STATUS_COLORS = {
  draft: 'text-gray-600 bg-gray-100',
  published: 'text-green-600 bg-green-100',
  cancelled: 'text-red-600 bg-red-100',
  completed: 'text-blue-600 bg-blue-100',
} as const

/**
 * 参加者ステータスのカラー
 */
export const ATTENDEE_STATUS_COLORS = {
  pending: 'text-yellow-600 bg-yellow-100',
  accepted: 'text-green-600 bg-green-100',
  declined: 'text-red-600 bg-red-100',
  maybe: 'text-gray-600 bg-gray-100',
} as const

/**
 * 日付フォーマットのオプション
 */
export const DATE_FORMAT_OPTIONS = {
  SHORT: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  LONG: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
    weekday: 'short' as const,
  },
  TIME: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
} as const