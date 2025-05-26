import { PrismaClient, UserRole, ProjectStatus, EventStatus, FileCategory, ApprovalStatus, ScheduleSlotStatus, NotificationType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPasswordHash = await hash('admin123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@prpro.com' },
    update: {},
    create: {
      email: 'admin@prpro.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      name: 'PRPro Admin'
    }
  })

  // Create demo users
  const userPasswordHash = await hash('user123456', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      name: 'Demo User'
    }
  })

  const mediaUser = await prisma.user.upsert({
    where: { email: 'media@example.com' },
    update: {},
    create: {
      email: 'media@example.com',
      passwordHash: userPasswordHash,
      role: UserRole.USER,
      name: 'Media Representative'
    }
  })

  // Create demo project
  const demoProject = await prisma.project.upsert({
    where: { uniqueUrl: 'demo-project-2024' },
    update: {},
    create: {
      name: 'デモプロジェクト 2024',
      description: 'PRProシステムのデモンストレーション用プロジェクトです。',
      uniqueUrl: 'demo-project-2024',
      adminId: admin.id,
      status: ProjectStatus.ACTIVE,
      settings: {
        schedule_adjustment_enabled: true,
        auto_approval: false,
        deadline_notifications: true
      }
    }
  })

  // Create demo event
  const demoEvent = await prisma.event.create({
    data: {
      projectId: demoProject.id,
      title: '新商品発表イベント',
      description: '2024年春の新商品ラインナップを発表するプレスイベントです。',
      eventDate: new Date('2024-06-15T14:00:00Z'),
      venue: '東京国際フォーラム ホールA',
      capacity: 200,
      requirements: 'プレス向けイベントのため、事前登録が必要です。',
      status: EventStatus.CONFIRMED
    }
  })

  // Create schedule slots
  const baseDate = new Date('2024-06-10')
  const scheduleSlots = await Promise.all([
    prisma.scheduleSlot.create({
      data: {
        projectId: demoProject.id,
        startTime: new Date(baseDate.setHours(10, 0, 0, 0)),
        endTime: new Date(baseDate.setHours(11, 0, 0, 0)),
        capacity: 5,
        status: ScheduleSlotStatus.AVAILABLE
      }
    }),
    prisma.scheduleSlot.create({
      data: {
        projectId: demoProject.id,
        startTime: new Date(baseDate.setHours(14, 0, 0, 0)),
        endTime: new Date(baseDate.setHours(15, 0, 0, 0)),
        capacity: 3,
        bookedCount: 1,
        status: ScheduleSlotStatus.AVAILABLE
      }
    }),
    prisma.scheduleSlot.create({
      data: {
        projectId: demoProject.id,
        startTime: new Date(baseDate.setHours(16, 0, 0, 0)),
        endTime: new Date(baseDate.setHours(17, 0, 0, 0)),
        capacity: 2,
        bookedCount: 2,
        status: ScheduleSlotStatus.FULL
      }
    })
  ])

  // Create booking for demo
  await prisma.booking.create({
    data: {
      scheduleSlotId: scheduleSlots[1].id,
      userId: demoUser.id,
      notes: 'インタビュー予約 - 新商品について'
    }
  })

  // Create demo files
  await prisma.file.createMany({
    data: [
      {
        projectId: demoProject.id,
        uploadedById: admin.id,
        originalName: 'プレスリリース_新商品発表.pdf',
        filePath: '/uploads/press-release-2024.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        category: FileCategory.PRESS_RELEASE,
        approvalStatus: ApprovalStatus.APPROVED
      },
      {
        projectId: demoProject.id,
        uploadedById: admin.id,
        originalName: '商品画像_メイン.jpg',
        filePath: '/uploads/product-main-image.jpg',
        fileSize: 512000,
        mimeType: 'image/jpeg',
        category: FileCategory.IMAGES,
        approvalStatus: ApprovalStatus.APPROVED
      },
      {
        projectId: demoProject.id,
        uploadedById: demoUser.id,
        originalName: 'インタビュー企画書.docx',
        filePath: '/uploads/interview-proposal.docx',
        fileSize: 256000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        category: FileCategory.PROPOSALS,
        approvalStatus: ApprovalStatus.UNDER_REVIEW,
        approvalComment: 'レビュー中 - 内容確認後に承認予定'
      }
    ]
  })

  // Create demo notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: NotificationType.APPROVAL_REQUEST,
        title: '承認が必要な書類があります',
        message: 'インタビュー企画書の承認をお待ちしています。',
        data: {
          fileId: 'file-id-placeholder',
          category: 'file_approval'
        }
      },
      {
        userId: demoUser.id,
        type: NotificationType.DEADLINE_REMINDER,
        title: '締切間近のお知らせ',
        message: '企画書の提出期限まで残り2日です。',
        data: {
          deadline: '2024-06-12',
          category: 'deadline'
        }
      },
      {
        userId: mediaUser.id,
        type: NotificationType.SCHEDULE_CONFIRMATION,
        title: 'スケジュール確定のお知らせ',
        message: 'インタビュースケジュールが確定しました。',
        read: true,
        data: {
          scheduleId: scheduleSlots[1].id,
          category: 'schedule'
        }
      }
    ]
  })

  console.log('✅ Seeding completed successfully!')
  console.log('📧 Admin user: admin@prpro.com / admin123456')
  console.log('👤 Demo user: demo@example.com / user123456')
  console.log('📺 Media user: media@example.com / user123456')
  console.log('🔗 Demo project URL: /project/demo-project-2024')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })