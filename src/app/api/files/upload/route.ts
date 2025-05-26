import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { StorageService } from '@/lib/storage'

const uploadSchema = z.object({
  projectId: z.string().uuid('無効なプロジェクトIDです'),
  category: z.enum(['OFFICIAL_MATERIALS', 'PRESS_RELEASE', 'IMAGES', 'VIDEOS', 'DOCUMENTS', 'PROPOSALS']),
})

export async function POST(request: NextRequest) {
  try {
    const user = AuthService.getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const category = formData.get('category') as string

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    const { projectId: validProjectId, category: validCategory } = uploadSchema.parse({
      projectId,
      category,
    })

    const project = await prisma.project.findUnique({
      where: { id: validProjectId },
    })

    if (!project) {
      return NextResponse.json({ error: 'プロジェクトが見つかりません' }, { status: 404 })
    }

    if (!StorageService.validateFileType(file.type)) {
      return NextResponse.json(
        { error: 'サポートされていないファイル形式です' },
        { status: 400 }
      )
    }

    if (!StorageService.validateFileSize(file.size)) {
      return NextResponse.json(
        { error: 'ファイルサイズが100MBを超えています' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileKey = StorageService.generateFileKey(validProjectId, file.name)
    
    const filePath = await StorageService.uploadFile(fileKey, buffer, file.type)

    const uploadedFile = await prisma.file.create({
      data: {
        projectId: validProjectId,
        uploadedBy: user.userId,
        originalName: file.name,
        filePath: fileKey,
        fileSize: file.size,
        mimeType: file.type,
        category: validCategory,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      file: uploadedFile,
      downloadUrl: await StorageService.getSignedDownloadUrl(fileKey),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    )
  }
}