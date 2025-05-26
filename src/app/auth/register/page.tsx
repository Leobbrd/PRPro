'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/store/auth'

const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'パスワードは英数字を含む必要があります'),
  name: z.string().min(1, '名前を入力してください').max(100, '名前は100文字以内で入力してください'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [error, setError] = useState('')
  const router = useRouter()
  const { isAuthenticated, isLoading, login, setLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const resetTime = new Date(result.resetTime).toLocaleTimeString('ja-JP')
          setError(`${result.error} リセット時刻: ${resetTime}`)
        } else {
          setError(result.error || '登録に失敗しました')
        }
        return
      }

      // Update auth state
      login(result.user, result.accessToken)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">新規登録</h1>
          <p className="text-gray-600">PR Proのアカウントを作成してください</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="お名前"
            type="text"
            placeholder="山田太郎"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="メールアドレス"
            type="email"
            placeholder="your@email.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="パスワード"
            type="password"
            placeholder="8文字以上の英数字"
            helperText="8文字以上で英数字を含む必要があります"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            loading={isLoading}
            className="w-full"
          >
            アカウント作成
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
              ログイン
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}