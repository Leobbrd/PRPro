'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'

interface PublicProject {
  id: string
  name: string
  description?: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  uniqueUrl: string
  createdAt: string
  updatedAt: string
  events: Array<{
    id: string
    title: string
    description?: string
    eventDate: string
    venue: string
    capacity: number
    status: 'PLANNING' | 'CONFIRMED' | 'CANCELLED'
  }>
  _count: {
    files: number
    events: number
    scheduleSlots: number
  }
}

const statusLabels = {
  DRAFT: '準備中',
  ACTIVE: '進行中',
  COMPLETED: '完了',
  ARCHIVED: '終了',
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-red-100 text-red-800',
}

const eventStatusLabels = {
  PLANNING: '企画中',
  CONFIRMED: '確定',
  CANCELLED: 'キャンセル',
}

const eventStatusColors = {
  PLANNING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function PublicProjectPage() {
  const params = useParams()
  const [project, setProject] = useState<PublicProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.uniqueUrl) {
      fetchProject()
    }
  }, [params.uniqueUrl])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/project/${params.uniqueUrl}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('プロジェクトが見つかりません')
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="text-sm text-gray-500 mb-2">PR Pro</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {project.name}
          </h1>
          <div className="flex justify-center items-center space-x-4">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                statusColors[project.status]
              }`}
            >
              {statusLabels[project.status]}
            </span>
            <span className="text-sm text-gray-500">
              更新: {new Date(project.updatedAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
        </div>

        {/* プロジェクト説明 */}
        {project.description && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              プロジェクト概要
            </h2>
            <p className="whitespace-pre-wrap text-gray-600">
              {project.description}
            </p>
          </Card>
        )}

        {/* イベント一覧 */}
        {project.events.length > 0 && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              イベント情報
            </h2>
            <div className="space-y-4">
              {project.events.map((event) => (
                <div
                  key={event.id}
                  className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="mt-2 text-gray-600">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(event.eventDate).toLocaleString('ja-JP')}
                        </div>
                        <div className="flex items-center">
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.venue}
                        </div>
                        <div className="flex items-center">
                          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          定員: {event.capacity}名
                        </div>
                      </div>
                    </div>
                    <span
                      className={`ml-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        eventStatusColors[event.status]
                      }`}
                    >
                      {eventStatusLabels[event.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 統計情報 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            プロジェクト統計
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {project._count.events}
              </div>
              <div className="text-sm text-gray-500">イベント</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {project._count.files}
              </div>
              <div className="text-sm text-gray-500">ファイル</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {project._count.scheduleSlots}
              </div>
              <div className="text-sm text-gray-500">スケジュール</div>
            </div>
          </div>
        </Card>

        {/* フッター */}
        <div className="mt-12 text-center">
          <div className="text-sm text-gray-500">
            Powered by <span className="font-medium">PR Pro</span>
          </div>
        </div>
      </div>
    </div>
  )
}