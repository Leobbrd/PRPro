'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { InvitationFormData } from '@/types/invitation'

interface InvitationFormProps {
  initialData?: Partial<InvitationFormData>
  onSubmit: (data: InvitationFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

/**
 * 招待状作成・編集フォームコンポーネント
 * @param initialData - 初期データ（編集時）
 * @param onSubmit - フォーム送信時のハンドラー
 * @param onCancel - キャンセル時のハンドラー
 * @param isLoading - ローディング状態
 */
export function InvitationForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: InvitationFormProps) {
  const [formData, setFormData] = useState<InvitationFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: initialData?.date || '',
    time: initialData?.time || '',
    location: initialData?.location || '',
    maxAttendees: initialData?.maxAttendees || 0,
    ...initialData
  })

  const [errors, setErrors] = useState<Partial<InvitationFormData>>({})

  /**
   * フォームバリデーション
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<InvitationFormData> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です'
    }

    if (!formData.date) {
      newErrors.date = '日付は必須です'
    }

    if (!formData.location.trim()) {
      newErrors.location = '場所は必須です'
    }

    if (formData.maxAttendees <= 0) {
      newErrors.maxAttendees = '参加者数は1以上で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * フォーム送信ハンドラー
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('フォーム送信エラー:', error)
    }
  }

  /**
   * 入力値変更ハンドラー
   */
  const handleChange = (field: keyof InvitationFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-gray-800">
          {initialData ? '招待状を編集' : '新しい招待状を作成'}
        </h2>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="パーティーのタイトルを入力"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="イベントの詳細を入力"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                日付 *
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.date && (
                <p className="text-red-600 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                時間
              </label>
              <input
                type="time"
                id="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              場所 *
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="開催場所を入力"
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          <div>
            <label htmlFor="maxAttendees" className="block text-sm font-medium text-gray-700 mb-2">
              最大参加者数 *
            </label>
            <input
              type="number"
              id="maxAttendees"
              value={formData.maxAttendees}
              onChange={(e) => handleChange('maxAttendees', parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="参加者数を入力"
            />
            {errors.maxAttendees && (
              <p className="text-red-600 text-sm mt-1">{errors.maxAttendees}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="flex-1"
            >
              {initialData ? '更新する' : '作成する'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                キャンセル
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}