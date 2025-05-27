import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

const updateProjectSchema = z.object({
  name: z.string().min(1, 'プロジェクト名を入力してください').max(100, 'プロジェクト名は100文字以内で入力してください').optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  settings: z.object({
    scheduleAdjustmentEnabled: z.boolean().optional(),
    autoApproval: z.boolean().optional(),
    deadlineNotifications: z.boolean().optional(),
  }).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            files: true,
            events: true,
            scheduleSlots: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    // 権限チェック：管理者またはプロジェクトオーナーのみアクセス可能
    if (
      user.role !== 'ADMIN' &&
      user.role !== 'SUPER_ADMIN' &&
      project.adminId !== user.userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json(
      { error: 'プロジェクトの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // プロジェクトの存在確認と権限チェック
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    if (
      user.role !== 'ADMIN' &&
      user.role !== 'SUPER_ADMIN' &&
      existingProject.adminId !== user.userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updateData = updateProjectSchema.parse(body)

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Update project error:', error)
    return NextResponse.json(
      { error: 'プロジェクトの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await AuthService.getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // プロジェクトの存在確認と権限チェック
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    if (
      user.role !== 'ADMIN' &&
      user.role !== 'SUPER_ADMIN' &&
      existingProject.adminId !== user.userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 論理削除（ステータスをARCHIVEDに変更）
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        status: 'ARCHIVED',
      },
    })

    return NextResponse.json({ 
      message: 'プロジェクトを削除しました',
      project 
    })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: 'プロジェクトの削除に失敗しました' },
      { status: 500 }
    )
  }
}
