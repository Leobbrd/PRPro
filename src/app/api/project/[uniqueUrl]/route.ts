import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { uniqueUrl: string } }
) {
  try {
    // 公開プロジェクトを取得（認証不要）
    const project = await prisma.project.findUnique({
      where: { uniqueUrl: params.uniqueUrl },
      include: {
        events: {
          where: {
            status: {
              in: ['CONFIRMED'], // 確定済みイベントのみ表示
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
            eventDate: true,
            venue: true,
            capacity: true,
            status: true,
          },
          orderBy: { eventDate: 'asc' },
        },
        _count: {
          select: {
            files: {
              where: {
                approvalStatus: 'APPROVED', // 承認済みファイルのみカウント
              },
            },
            events: {
              where: {
                status: 'CONFIRMED',
              },
            },
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

    // 非公開プロジェクトの場合は表示しない
    if (project.status === 'DRAFT' || project.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'このプロジェクトは公開されていません' },
        { status: 404 }
      )
    }

    // 公開情報のみを返す（管理者情報は除外）
    const publicProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      uniqueUrl: project.uniqueUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      events: project.events,
      _count: project._count,
    }

    return NextResponse.json({ project: publicProject })
  } catch (error) {
    console.error('Get public project error:', error)
    return NextResponse.json(
      { error: 'プロジェクトの取得に失敗しました' },
      { status: 500 }
    )
  }
}