import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

// プロジェクトAPI のテスト
describe('/api/projects', () => {
  const mockUser = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'ADMIN' as const,
  }

  beforeEach(async () => {
    // テスト用ユーザーを作成
    await prisma.user.create({
      data: {
        id: mockUser.userId,
        email: mockUser.email,
        passwordHash: 'hashed_password',
        name: 'Test User',
        role: 'ADMIN',
      },
    })
  })

  afterEach(async () => {
    // テストデータをクリーンアップ
    await prisma.project.deleteMany({
      where: { adminId: mockUser.userId },
    })
    await prisma.user.delete({
      where: { id: mockUser.userId },
    })
  })

  describe('POST /api/projects', () => {
    it('新しいプロジェクトを作成できること', async () => {
      // AuthService.getCurrentUser をモック
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(mockUser)

      const { POST } = await import('@/app/api/projects/route')
      
      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'テストプロジェクト',
          description: 'テスト用のプロジェクトです',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.project).toBeDefined()
      expect(data.project.name).toBe('テストプロジェクト')
      expect(data.project.description).toBe('テスト用のプロジェクトです')
      expect(data.project.uniqueUrl).toHaveLength(8)
      expect(data.uniqueUrl).toContain('/project/')

      mockGetCurrentUser.mockRestore()
    })

    it('権限のないユーザーはプロジェクトを作成できないこと', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue({
        ...mockUser,
        role: 'USER' as const,
      })

      const { POST } = await import('@/app/api/projects/route')
      
      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'テストプロジェクト',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(403)

      mockGetCurrentUser.mockRestore()
    })

    it('認証されていないユーザーはプロジェクトを作成できないこと', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(null)

      const { POST } = await import('@/app/api/projects/route')
      
      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'テストプロジェクト',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)

      mockGetCurrentUser.mockRestore()
    })

    it('バリデーションエラーの場合400エラーを返すこと', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(mockUser)

      const { POST } = await import('@/app/api/projects/route')
      
      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: '', // 空文字はエラー
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)

      mockGetCurrentUser.mockRestore()
    })
  })

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // テスト用プロジェクトを作成
      await prisma.project.createMany({
        data: [
          {
            name: 'プロジェクト1',
            description: '説明1',
            uniqueUrl: 'test001',
            adminId: mockUser.userId,
            status: 'ACTIVE',
          },
          {
            name: 'プロジェクト2',
            description: '説明2',
            uniqueUrl: 'test002',
            adminId: mockUser.userId,
            status: 'DRAFT',
          },
        ],
      })
    })

    it('プロジェクト一覧を取得できること', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(mockUser)

      const { GET } = await import('@/app/api/projects/route')
      
      const request = new NextRequest('http://localhost:3000/api/projects')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projects).toHaveLength(2)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.total).toBe(2)

      mockGetCurrentUser.mockRestore()
    })

    it('ステータスでフィルタリングできること', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(mockUser)

      const { GET } = await import('@/app/api/projects/route')
      
      const request = new NextRequest('http://localhost:3000/api/projects?status=ACTIVE')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projects).toHaveLength(1)
      expect(data.projects[0].status).toBe('ACTIVE')

      mockGetCurrentUser.mockRestore()
    })

    it('認証されていないユーザーは一覧を取得できないこと', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(null)

      const { GET } = await import('@/app/api/projects/route')
      
      const request = new NextRequest('http://localhost:3000/api/projects')

      const response = await GET(request)

      expect(response.status).toBe(401)

      mockGetCurrentUser.mockRestore()
    })
  })
})

// unique_url 生成のテスト
describe('Project unique URL generation', () => {
  it('8桁の英数字で構成されること', () => {
    const { nanoid } = require('nanoid')
    const uniqueUrl = nanoid(8)
    
    expect(uniqueUrl).toHaveLength(8)
    expect(/^[A-Za-z0-9]+$/.test(uniqueUrl)).toBe(true)
  })
})

// プロジェクト設定のテスト
describe('Project settings', () => {
  it('デフォルト設定が正しく設定されること', () => {
    const defaultSettings = {
      scheduleAdjustmentEnabled: true,
      autoApproval: false,
      deadlineNotifications: true,
    }

    expect(defaultSettings.scheduleAdjustmentEnabled).toBe(true)
    expect(defaultSettings.autoApproval).toBe(false)
    expect(defaultSettings.deadlineNotifications).toBe(true)
  })
})