import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { 
  withAuthAPI, 
  validateBody, 
  validateQuery, 
  paginationSchema,
  getPaginationData,
  APIError
} from '@/lib/api-utils'
import { 
  Project, 
  CreateProjectForm, 
  ProjectsQuery, 
  PaginatedResponse,
  PROJECT_STATUS 
} from '@/types'

const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'プロジェクト名を入力してください')
    .max(100, 'プロジェクト名は100文字以内で入力してください'),
  description: z.string().optional(),
})

const listProjectsSchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
})

// Create project (Admin/SuperAdmin only)
export const POST = withAuthAPI<Project>(
  async (request: NextRequest, user) => {
    // Check admin permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new APIError('管理者権限が必要です', 403)
    }

    const body = await request.json()
    const data = validateBody(createProjectSchema, body)

    // Generate unique URL
    const uniqueUrl = await generateUniqueUrl()

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
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
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            files: true,
            events: true,
          },
        },
      },
    })

    // Transform to match our type
    const transformedProject: Project = {
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      uniqueUrl: project.uniqueUrl,
      adminId: project.adminId,
      status: project.status,
      settings: project.settings as any,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      admin: project.admin ? {
        id: project.admin.id,
        name: project.admin.name,
        email: project.admin.email,
        role: 'ADMIN' as any,
        createdAt: project.admin.createdAt.toISOString(),
        updatedAt: project.admin.updatedAt.toISOString(),
      } : undefined,
      _count: project._count,
    }

    return transformedProject
  },
  ['ADMIN', 'SUPER_ADMIN']
)

// List projects
export const GET = withAuthAPI<PaginatedResponse<Project>>(
  async (request: NextRequest, user) => {
    const { searchParams } = new URL(request.url)
    const query = validateQuery(listProjectsSchema, searchParams)

    const { page, limit, status } = query
    const { skip } = getPaginationData(page, limit, 0)

    // Build where clause based on user role
    let where: any = status ? { status } : {}
    
    // Non-admin users can only see their own projects
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
              createdAt: true,
              updatedAt: true,
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

    // Transform projects
    const transformedProjects: Project[] = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      uniqueUrl: project.uniqueUrl,
      adminId: project.adminId,
      status: project.status,
      settings: project.settings as any,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      admin: project.admin ? {
        id: project.admin.id,
        name: project.admin.name,
        email: project.admin.email,
        role: 'ADMIN' as any,
        createdAt: project.admin.createdAt.toISOString(),
        updatedAt: project.admin.updatedAt.toISOString(),
      } : undefined,
      _count: project._count,
    }))

    const pagination = getPaginationData(page, limit, total)

    return {
      data: transformedProjects,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: pagination.pages,
      },
    }
  }
)

// Helper function to generate unique URL
async function generateUniqueUrl(): Promise<string> {
  const maxAttempts = 10
  let attempts = 0

  while (attempts < maxAttempts) {
    const uniqueUrl = nanoid(8)
    const existing = await prisma.project.findUnique({
      where: { uniqueUrl },
    })
    
    if (!existing) {
      return uniqueUrl
    }
    
    attempts++
  }

  throw new APIError('ユニークURLの生成に失敗しました', 500)
}
