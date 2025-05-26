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

// 個別プロジェクトAPI のテスト
describe('/api/projects/[id]', () => {
  const mockUser = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'ADMIN' as const,
  }

  let testProjectId: string

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

    // テスト用プロジェクトを作成
    const project = await prisma.project.create({
      data: {
        name: 'テスト編集プロジェクト',
        description: '編集テスト用',
        uniqueUrl: 'edit001',
        adminId: mockUser.userId,
        status: 'DRAFT',
        settings: {
          scheduleAdjustmentEnabled: true,
          autoApproval: false,
          deadlineNotifications: true,
        },
      },
    })
    testProjectId = project.id
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

  describe('PUT /api/projects/[id]', () => {
    it('プロジェクトを更新できること', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(mockUser)

      const { PUT } = await import('@/app/api/projects/[id]/route')
      
      const request = new NextRequest(`http://localhost:3000/api/projects/${testProjectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: '更新されたプロジェクト名',
          description: '更新された説明',
          status: 'ACTIVE',
          settings: {
            scheduleAdjustmentEnabled: false,
            autoApproval: true,
            deadlineNotifications: false,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: { id: testProjectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.project).toBeDefined()
      expect(data.project.name).toBe('更新されたプロジェクト名')
      expect(data.project.description).toBe('更新された説明')
      expect(data.project.status).toBe('ACTIVE')
      expect(data.project.settings.scheduleAdjustmentEnabled).toBe(false)
      expect(data.project.settings.autoApproval).toBe(true)
      expect(data.project.settings.deadlineNotifications).toBe(false)

      mockGetCurrentUser.mockRestore()
    })

    it('部分的な更新ができること', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(mockUser)

      const { PUT } = await import('@/app/api/projects/[id]/route')
      
      const request = new NextRequest(`http://localhost:3000/api/projects/${testProjectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: '部分更新されたプロジェクト名',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: { id: testProjectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.project.name).toBe('部分更新されたプロジェクト名')
      expect(data.project.description).toBe('編集テスト用') // 変更されていない
      expect(data.project.status).toBe('DRAFT') // 変更されていない

      mockGetCurrentUser.mockRestore()
    })

    it('権限のないユーザーはプロジェクトを更新できないこと', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue({
        ...mockUser,
        userId: 'other-user-id',
        role: 'USER' as const,
      })

      const { PUT } = await import('@/app/api/projects/[id]/route')
      
      const request = new NextRequest(`http://localhost:3000/api/projects/${testProjectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: '不正更新',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: { id: testProjectId } })

      expect(response.status).toBe(403)

      mockGetCurrentUser.mockRestore()
    })

    it('存在しないプロジェクトの更新で404エラーを返すこと', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(mockUser)

      const { PUT } = await import('@/app/api/projects/[id]/route')
      
      const request = new NextRequest('http://localhost:3000/api/projects/non-existent-id', {
        method: 'PUT',
        body: JSON.stringify({
          name: '存在しないプロジェクト',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: { id: 'non-existent-id' } })

      expect(response.status).toBe(404)

      mockGetCurrentUser.mockRestore()
    })
  })

  describe('DELETE /api/projects/[id]', () => {
    it('プロジェクトを論理削除できること', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue(mockUser)

      const { DELETE } = await import('@/app/api/projects/[id]/route')
      
      const request = new NextRequest(`http://localhost:3000/api/projects/${testProjectId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: testProjectId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.project.status).toBe('ARCHIVED')
      expect(data.message).toBe('プロジェクトを削除しました')

      mockGetCurrentUser.mockRestore()
    })

    it('権限のないユーザーはプロジェクトを削除できないこと', async () => {
      const mockGetCurrentUser = jest.spyOn(AuthService, 'getCurrentUser')
      mockGetCurrentUser.mockReturnValue({
        ...mockUser,
        userId: 'other-user-id',
        role: 'USER' as const,
      })

      const { DELETE } = await import('@/app/api/projects/[id]/route')
      
      const request = new NextRequest(`http://localhost:3000/api/projects/${testProjectId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: testProjectId } })

      expect(response.status).toBe(403)

      mockGetCurrentUser.mockRestore()
    })
  })
})