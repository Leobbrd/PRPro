'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'

const editProjectSchema = z.object({
  name: z.string().min(1, 'プロジェクト名を入力してください').max(100, 'プロジェクト名は100文字以内で入力してください'),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
  settings: z.object({
    scheduleAdjustmentEnabled: z.boolean(),
    autoApproval: z.boolean(),
    deadlineNotifications: z.boolean(),
  }),
})

type EditProjectForm = z.infer<typeof editProjectSchema>

interface Project {
  id: string
  name: string
  description?: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  uniqueUrl: string
  createdAt: string
  updatedAt: string
  settings: {
    scheduleAdjustmentEnabled?: boolean
    autoApproval?: boolean
    deadlineNotifications?: boolean
  }
  admin: {
    id: string
    name: string
    email: string
  }
}

const statusOptions = [
  { value: 'DRAFT', label: '下書き' },
  { value: 'ACTIVE', label: '進行中' },
  { value: 'COMPLETED', label: '完了' },
  { value: 'ARCHIVED', label: 'アーカイブ' },
] as const

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      settings: {
        scheduleAdjustmentEnabled: true,
        autoApproval: false,
        deadlineNotifications: true,
      },
    },
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (isAuthenticated && params.id) {
      fetchProject()
    }
  }, [isAuthenticated, isLoading, router, params.id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('プロジェクトが見つかりません')
        } else if (response.status === 403) {
          throw new Error('このプロジェクトを編集する権限がありません')
        }
        throw new Error('プロジェクトの取得に失敗しました')
      }

      const data = await response.json()
      const fetchedProject = data.project
      setProject(fetchedProject)

      // フォームに現在の値を設定
      setValue('name', fetchedProject.name)
      setValue('description', fetchedProject.description || '')
      setValue('status', fetchedProject.status)
      setValue('settings.scheduleAdjustmentEnabled', fetchedProject.settings.scheduleAdjustmentEnabled ?? true)
      setValue('settings.autoApproval', fetchedProject.settings.autoApproval ?? false)
      setValue('settings.deadlineNotifications', fetchedProject.settings.deadlineNotifications ?? true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: EditProjectForm) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'プロジェクトの更新に失敗しました')
      }

      router.push(`/dashboard/projects/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/projects/${params.id}`)
  }

  const canEdit = project && (
    user?.role === 'ADMIN' || 
    user?.role === 'SUPER_ADMIN' || 
    project.admin.id === user?.id
  )

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">プロジェクトを読み込み中...</div>
      </div>
    )
  }

  if (error || !project || !canEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Button variant="secondary" onClick={handleCancel} className="mb-6">
            ← 戻る
          </Button>
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">
              {error || 'このプロジェクトを編集する権限がありません'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="secondary" onClick={handleCancel}>
            ← プロジェクト詳細に戻る
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              プロジェクト編集
            </h1>
            <p className="mt-2 text-gray-600">
              プロジェクト「{project.name}」の情報を編集します。
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* プロジェクト名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                プロジェクト名 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <Input
                  id="name"
                  type="text"
                  placeholder="プロジェクト名を入力してください"
                  {...register('name')}
                  error={errors.name?.message}
                />
              </div>
            </div>

            {/* 説明 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                説明
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="プロジェクトの説明を入力してください（任意）"
                  {...register('description')}
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* ステータス */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                ステータス <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  {...register('status')}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            {/* プロジェクト設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                プロジェクト設定
              </label>
              <div className="space-y-4">
                {/* 日程調整機能 */}
                <div className="flex items-center">
                  <input
                    id="scheduleAdjustmentEnabled"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register('settings.scheduleAdjustmentEnabled')}
                  />
                  <label htmlFor="scheduleAdjustmentEnabled" className="ml-3 text-sm text-gray-700">
                    日程調整機能を有効にする
                  </label>
                </div>

                {/* 自動承認 */}
                <div className="flex items-center">
                  <input
                    id="autoApproval"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register('settings.autoApproval')}
                  />
                  <label htmlFor="autoApproval" className="ml-3 text-sm text-gray-700">
                    提出物の自動承認を有効にする
                  </label>
                </div>

                {/* 期限通知 */}
                <div className="flex items-center">
                  <input
                    id="deadlineNotifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register('settings.deadlineNotifications')}
                  />
                  <label htmlFor="deadlineNotifications" className="ml-3 text-sm text-gray-700">
                    期限通知を有効にする
                  </label>
                </div>
              </div>
            </div>

            {/* 公開URL情報（読み取り専用） */}
            <div className="rounded-md bg-gray-50 p-4">
              <div className="text-sm text-gray-700">
                <h4 className="font-medium">公開URL（変更不可）:</h4>
                <div className="mt-2 flex items-center space-x-2">
                  <code className="flex-1 rounded bg-white px-3 py-2 text-sm">
                    /project/{project.uniqueUrl}
                  </code>
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? '更新中...' : '変更を保存'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}