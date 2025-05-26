import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { uniqueUrl: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { 
        uniqueUrl: params.uniqueUrl,
        status: { not: 'ARCHIVED' } // アーカイブされたプロジェクトは非表示
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        events: {
          where: {
            status: { not: 'CANCELLED' }
          },
          orderBy: {
            eventDate: 'asc'
          }
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

    // 公開URLアクセスでは機密情報を除外
    const publicProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      uniqueUrl: project.uniqueUrl,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      events: project.events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
        venue: event.venue,
        capacity: event.capacity,
        status: event.status,
      })),
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