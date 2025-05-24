'use client'

import { useState, useEffect } from 'react'
import { InvitationData, InvitationFilter, InvitationSort } from '@/types/invitation'
import { invitationService } from '@/services/invitation-service'

/**
 * 招待状一覧管理用カスタムフック
 * @param initialFilter - 初期フィルター条件
 * @param initialSort - 初期ソート条件
 */
export function useInvitations(
  initialFilter?: InvitationFilter,
  initialSort?: InvitationSort
) {
  const [invitations, setInvitations] = useState<InvitationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<InvitationFilter>(initialFilter || {})
  const [sort, setSort] = useState<InvitationSort>(
    initialSort || { field: 'date', direction: 'desc' }
  )

  /**
   * 招待状一覧を取得する
   */
  const fetchInvitations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await invitationService.getInvitations({
        filter,
        sort
      })
      
      setInvitations(response.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '招待状の取得に失敗しました'
      setError(errorMessage)
      console.error('招待状取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 招待状を削除する
   * @param id - 削除する招待状のID
   */
  const deleteInvitation = async (id: string) => {
    try {
      await invitationService.deleteInvitation(id)
      setInvitations(prev => prev.filter(invitation => invitation.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '招待状の削除に失敗しました'
      setError(errorMessage)
      console.error('招待状削除エラー:', err)
      throw err
    }
  }

  /**
   * フィルター条件を更新する
   * @param newFilter - 新しいフィルター条件
   */
  const updateFilter = (newFilter: Partial<InvitationFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }))
  }

  /**
   * ソート条件を更新する
   * @param newSort - 新しいソート条件
   */
  const updateSort = (newSort: InvitationSort) => {
    setSort(newSort)
  }

  /**
   * データをリフレッシュする
   */
  const refresh = () => {
    fetchInvitations()
  }

  // フィルターまたはソート条件が変更された時にデータを再取得
  useEffect(() => {
    fetchInvitations()
  }, [filter, sort])

  return {
    invitations,
    loading,
    error,
    filter,
    sort,
    deleteInvitation,
    updateFilter,
    updateSort,
    refresh
  }
}