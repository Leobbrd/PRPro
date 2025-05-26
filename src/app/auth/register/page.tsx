'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '登録に失敗しました')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました')
    } finally {
      setIsLoading(false)
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