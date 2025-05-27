'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  admin: {
    id: string
    name: string
    email: string
  }
  _count: {
    files: number
    events: number
  }
}

interface ProjectsResponse {
  projects: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
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

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (isAuthenticated) {
      fetchProjects()
    }
  }, [isAuthenticated, isLoading, router])

  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects?page=${page}&limit=20`)
      if (!response.ok) throw new Error('プロジェクトの取得に失敗しました')

      const data: ProjectsResponse = await response.json()
      setProjects(data.projects)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = () => {
    router.push('/dashboard/projects/new')
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}/edit`)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">プロジェクト管理</h1>
            <p className="mt-2 text-gray-600">{user?.name}さん、お疲れさまです</p>
          </div>
          <div className="flex space-x-4">
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <Button onClick={handleCreateProject}>新規プロジェクト作成</Button>
            )}
            <Button variant="secondary" onClick={handleLogout}>ログアウト</Button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 読み込み中 or プロジェクト一覧 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-lg text-gray-600">読み込み中...</div>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {project.name}
                    </h3>
                    <span className={`ml-2 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                  </div>
                  {project.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                    <span>イベント: {project._count.events}</span>
                    <span>ファイル: {project._count.files}</span>
                  </div>
                  <div className="mt-4 text-xs text-gray-400">
                    更新: {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">プロジェクトがありません</h3>
              <p className="mt-2 text-gray-600">新しいプロジェクトを作成して始めましょう</p>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <Button className="mt-4" onClick={handleCreateProject}>
                  最初のプロジェクトを作成
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ページネーション */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {pagination.total} 件中 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 件表示
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                disabled={pagination.page === 1}
                onClick={() => fetchProjects(pagination.page - 1)}
              >
                前へ
              </Button>
              <Button
                variant="secondary"
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchProjects(pagination.page + 1)}
              >
                次へ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

