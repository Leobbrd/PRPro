import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * クラス名をマージするユーティリティ関数
 * Tailwind CSSのクラス名を効率的に結合する
 * @param inputs - 結合するクラス名
 * @returns マージされたクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 日付を日本語形式でフォーマットする
 * @param date - フォーマットする日付
 * @param options - フォーマットオプション
 * @returns フォーマット済み日付文字列
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleDateString('ja-JP', defaultOptions)
  } catch (error) {
    console.error('日付フォーマットエラー:', error)
    return typeof date === 'string' ? date : date.toString()
  }
}

/**
 * 時刻を日本語形式でフォーマットする
 * @param time - フォーマットする時刻（HH:MM形式）
 * @returns フォーマット済み時刻文字列
 */
export function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const min = parseInt(minutes, 10)
    
    return `${hour}時${min.toString().padStart(2, '0')}分`
  } catch (error) {
    console.error('時刻フォーマットエラー:', error)
    return time
  }
}

/**
 * 文字列をトランケートする
 * @param text - トランケートする文字列
 * @param maxLength - 最大文字数
 * @returns トランケート済み文字列
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

/**
 * 値が空かどうかを判定する
 * @param value - 判定する値
 * @returns 空の場合true
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 数値を3桁区切りでフォーマットする
 * @param num - フォーマットする数値
 * @returns フォーマット済み数値文字列
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ja-JP')
}

/**
 * URLが有効かどうかを判定する
 * @param url - 判定するURL
 * @returns 有効な場合true
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * メールアドレスが有効かどうかを判定する
 * @param email - 判定するメールアドレス
 * @returns 有効な場合true
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}