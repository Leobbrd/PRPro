'use client'

import { useState } from 'react'
import { InvitationFormData } from '@/types/invitation'
import { invitationService } from '@/services/invitation-service'

/**
 * 招待状フォーム管理用カスタムフック
 */
export function useInvitationForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 新しい招待状を作成する
   * @param formData - フォームデータ
   */
  const createInvitation = async (formData: InvitationFormData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await invitationService.createInvitation(formData)
      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '招待状の作成に失敗しました'
      setError(errorMessage)
      console.error('招待状作成エラー:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * 招待状を更新する
   * @param id - 更新する招待状のID
   * @param formData - フォームデータ
   */
  const updateInvitation = async (id: string, formData: InvitationFormData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await invitationService.updateInvitation(id, formData)
      return response.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '招待状の更新に失敗しました'
      setError(errorMessage)
      console.error('招待状更新エラー:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * エラーをクリアする
   */
  const clearError = () => {
    setError(null)
  }

  return {
    loading,
    error,
    createInvitation,
    updateInvitation,
    clearError
  }
}