'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth'

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
  _count: {
    files: number
    events: number
    scheduleSlots: number
  }
}

const statusLabels = {
  DRAFT: '下書き',
  ACTIVE: '進行中',
  COMPLETED: '完了',
  ARCHIVED: 'アーカイブ',
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-red-100 text-red-800',
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          throw new Error('このプロジェクトにアクセスする権限がありません')
        }
        throw new Error('プロジェクトの取得に失敗しました')
      }

      const data = await response.json()
      setProject(data.project)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/dashboard/projects/${params.id}/edit`)
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleDelete = async () => {
    if (!confirm('このプロジェクトを削除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('プロジェクトの削除に失敗しました')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const canEdit = project && (
    user?.role === 'ADMIN' || 
    user?.role === 'SUPER_ADMIN' || 
    project.admin.id === user?.userId
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

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Button variant="secondary" onClick={handleBack} className="mb-6">
            ← 戻る
          </Button>
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">
              {error || 'プロジェクトが見つかりません'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <Button variant="secondary" onClick={handleBack}>
            ← プロジェクト一覧に戻る
          </Button>
          {canEdit && (
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={handleEdit}>
                編集
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                削除
              </Button>
            </div>
          )}
        </div>

        {/* プロジェクト情報 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* メイン情報 */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {project.name}
                  </h1>
                  <div className="mt-2 flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                        statusColors[project.status]
                      }`}
                    >
                      {statusLabels[project.status]}
                    </span>
                    <span className="text-sm text-gray-500">
                      作成: {new Date(project.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                    <span className="text-sm text-gray-500">
                      更新: {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              </div>

              {project.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">説明</h3>
                  <p className="mt-2 whitespace-pre-wrap text-gray-600">
                    {project.description}
                  </p>
                </div>
              )}

              {/* 公開URL */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900">公開URL</h3>
                <div className="mt-2 flex items-center space-x-2">
                  <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm">
                    {`${window.location.origin}/project/${project.uniqueUrl}`}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/project/${project.uniqueUrl}`
                      )
                    }}
                  >
                    コピー
                  </Button>
                </div>
              </div>
            </Card>

            {/* 統計情報 */}
            <Card className="mt-6 p-6">
              <h3 className="text-lg font-medium text-gray-900">統計情報</h3>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {project._count.events}
                  </div>
                  <div className="text-sm text-gray-500">イベント</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {project._count.files}
                  </div>
                  <div className="text-sm text-gray-500">ファイル</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {project._count.scheduleSlots}
                  </div>
                  <div className="text-sm text-gray-500">スケジュール</div>
                </div>
              </div>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 管理者情報 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900">管理者</h3>
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900">
                  {project.admin.name}
                </div>
                <div className="text-sm text-gray-500">
                  {project.admin.email}
                </div>
              </div>
            </Card>

            {/* 設定情報 */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900">設定</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">日程調整</span>
                  <span className={`text-sm font-medium ${
                    project.settings.scheduleAdjustmentEnabled ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {project.settings.scheduleAdjustmentEnabled ? '有効' : '無効'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">自動承認</span>
                  <span className={`text-sm font-medium ${
                    project.settings.autoApproval ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {project.settings.autoApproval ? '有効' : '無効'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">期限通知</span>
                  <span className={`text-sm font-medium ${
                    project.settings.deadlineNotifications ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {project.settings.deadlineNotifications ? '有効' : '無効'}
                  </span>
                </div>
              </div>
            </Card>

            {/* アクション */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900">アクション</h3>
              <div className="mt-4 space-y-3">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/projects/${project.id}/events`)}
                >
                  イベント管理
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/projects/${project.id}/files`)}
                >
                  ファイル管理
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/projects/${project.id}/schedule`)}
                >
                  スケジュール管理
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}