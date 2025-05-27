import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { nanoid } from 'nanoid'

const createProjectSchema = z.object({
  name: z.string().min(1, 'プロジェクト名を入力してください').max(100, 'プロジェクト名は100文字以内で入力してください'),
  description: z.string().optional(),
})

const listProjectsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = createProjectSchema.parse(body)

    let uniqueUrl: string
    let isUnique = false
    let attempts = 0

    do {
      uniqueUrl = nanoid(8)
      const existing = await prisma.project.findUnique({
        where: { uniqueUrl },
      })
      isUnique = !existing
      attempts++
    } while (!isUnique && attempts < 10)

    if (!isUnique) {
      return NextResponse.json(
        { error: 'ユニークURLの生成に失敗しました' },
        { status: 500 }
      )
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        uniqueUrl,
        adminId: user.userId,
        settings: {
          scheduleAdjustmentEnabled: true,
          autoApproval: false,
          deadlineNotifications: true,
        },
      },
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

    return NextResponse.json({
      project,
      uniqueUrl: `${process.env.NEXTAUTH_URL}/project/${uniqueUrl}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Create project error:', error)
    return NextResponse.json(
      { error: 'プロジェクトの作成に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const { page, limit, status } = listProjectsSchema.parse(params)

    const skip = (page - 1) * limit
    
    const where = status ? { status } : {}
    
    if (user.role === 'USER' || user.role === 'GUEST') {
      where.adminId = user.userId
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
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
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('List projects error:', error)
    return NextResponse.json(
      { error: 'プロジェクト一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}
