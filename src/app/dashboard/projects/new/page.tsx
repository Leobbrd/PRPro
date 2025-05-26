'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const createProjectSchema = z.object({
  name: z.string().min(1, 'プロジェクト名を入力してください').max(100, 'プロジェクト名は100文字以内で入力してください'),
  description: z.string().optional(),
})

type CreateProjectForm = z.infer<typeof createProjectSchema>

export default function NewProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
  })

  const onSubmit = async (data: CreateProjectForm) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'プロジェクトの作成に失敗しました')
      }

      const result = await response.json()
      router.push(`/dashboard/projects/${result.project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="secondary" onClick={handleCancel}>
            ← プロジェクト一覧に戻る
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              新規プロジェクト作成
            </h1>
            <p className="mt-2 text-gray-600">
              新しいプロジェクトを作成します。必要な情報を入力してください。
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

            {/* プロジェクト設定の説明 */}
            <div className="rounded-md bg-blue-50 p-4">
              <div className="text-sm text-blue-700">
                <h4 className="font-medium">自動設定される項目:</h4>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>一意のプロジェクトURL（8桁英数字）が自動生成されます</li>
                  <li>初期ステータスは「下書き」に設定されます</li>
                  <li>日程調整機能と期限通知が有効になります</li>
                  <li>自動承認は無効に設定されます</li>
                </ul>
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
                {isSubmitting ? '作成中...' : 'プロジェクトを作成'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}