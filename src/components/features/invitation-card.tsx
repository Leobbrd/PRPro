import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InvitationData } from '@/types/invitation'

interface InvitationCardProps {
  title: string
  date: string
  location: string
  attendees: number
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
}

/**
 * 招待状カードコンポーネント
 * @param title - 招待状のタイトル
 * @param date - イベント日時
 * @param location - 開催場所
 * @param attendees - 参加者数
 * @param onEdit - 編集ボタンクリック時のハンドラー
 * @param onDelete - 削除ボタンクリック時のハンドラー
 * @param onView - 詳細表示ボタンクリック時のハンドラー
 */
export function InvitationCard({
  title,
  date,
  location,
  attendees,
  onEdit,
  onDelete,
  onView
}: InvitationCardProps) {
  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
    } catch (error) {
      return dateString
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {title}
        </h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center">
            <span className="mr-2">📅</span>
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">📍</span>
            <span>{location}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">👥</span>
            <span>{attendees}人が参加予定</span>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          className="flex-1"
        >
          詳細
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onEdit}
          className="flex-1"
        >
          編集
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          削除
        </Button>
      </CardFooter>
    </Card>
  )
}