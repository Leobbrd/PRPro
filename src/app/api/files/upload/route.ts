import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { StorageService } from '@/lib/storage'
import { uploadRateLimit, getClientIP } from '@/lib/rate-limit'
import { 
  withAuthAPI, 
  validateBody, 
  NotFoundError,
  ValidationError,
  APIError
} from '@/lib/api-utils'
import { File, FILE_CATEGORIES } from '@/types'

const uploadSchema = z.object({
  projectId: z.string().uuid('無効なプロジェクトIDです'),
  category: z.enum(['OFFICIAL_MATERIALS', 'PRESS_RELEASE', 'IMAGES', 'VIDEOS', 'DOCUMENTS', 'PROPOSALS']),
})

export const POST = withAuthAPI<{ file: File; downloadUrl: string }>(
  async (request: NextRequest, user) => {
    // Rate limiting for file uploads
    const clientIP = getClientIP(request)
    const limitResult = await uploadRateLimit.checkLimit(clientIP)

    if (!limitResult.allowed) {
      throw new APIError(
        'アップロード制限に達しました。しばらく待ってから再試行してください。',
        429
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const category = formData.get('category') as string

    if (!file) {
      throw new ValidationError('ファイルが選択されていません')
    }

    // Validate form data
    const validatedData = validateBody(uploadSchema, { projectId, category })

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: {
        id: true,
        adminId: true,
        name: true,
      },
    })

    if (!project) {
      throw new NotFoundError('プロジェクトが見つかりません')
    }

    // Check access permissions (admin can access all, users only their projects)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role) && project.adminId !== user.userId) {
      throw new APIError('このプロジェクトにアクセスする権限がありません', 403)
    }

    // Validate file type and size
    if (!StorageService.validateFileType(file.type)) {
      throw new ValidationError(
        'サポートされていないファイル形式です。PDF、Word、画像、動画ファイルのみアップロード可能です。'
      )
    }

    if (!StorageService.validateFileSize(file.size)) {
      throw new ValidationError('ファイルサイズが100MBを超えています')
    }

    // Upload file to storage
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileKey = StorageService.generateFileKey(validatedData.projectId, file.name)
    
    try {
      await StorageService.uploadFile(fileKey, buffer, file.type)
    } catch (error) {
      console.error('Storage upload error:', error)
      throw new APIError('ファイルのアップロードに失敗しました')
    }

    // Save file record to database
    const uploadedFile = await prisma.file.create({
      data: {
        projectId: validatedData.projectId,
        uploadedById: user.userId,
        originalName: file.name,
        filePath: fileKey,
        fileSize: file.size,
        mimeType: file.type,
        category: validatedData.category,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Generate download URL
    const downloadUrl = await StorageService.getSignedDownloadUrl(fileKey)

    // Transform to match our type
    const transformedFile: File = {
      id: uploadedFile.id,
      projectId: uploadedFile.projectId,
      uploadedById: uploadedFile.uploadedById,
      originalName: uploadedFile.originalName,
      filePath: uploadedFile.filePath,
      fileSize: uploadedFile.fileSize,
      mimeType: uploadedFile.mimeType,
      category: uploadedFile.category,
      approvalStatus: uploadedFile.approvalStatus,
      approvalComment: uploadedFile.approvalComment || undefined,
      createdAt: uploadedFile.createdAt.toISOString(),
      updatedAt: uploadedFile.updatedAt.toISOString(),
      uploadedBy: uploadedFile.uploadedBy ? {
        id: uploadedFile.uploadedBy.id,
        name: uploadedFile.uploadedBy.name,
        email: uploadedFile.uploadedBy.email,
        role: 'USER' as any,
        createdAt: uploadedFile.uploadedBy.createdAt.toISOString(),
        updatedAt: uploadedFile.uploadedBy.updatedAt.toISOString(),
      } : undefined,
      project: uploadedFile.project ? {
        id: uploadedFile.project.id,
        name: uploadedFile.project.name,
        description: undefined,
        uniqueUrl: '',
        adminId: '',
        status: 'DRAFT' as any,
        settings: {} as any,
        createdAt: '',
        updatedAt: '',
      } : undefined,
    }

    return {
      file: transformedFile,
      downloadUrl,
    }
  }
)
