import { InvitationCard } from '@/components/features/invitation-card'
import { Button } from '@/components/ui/button'

/**
 * メインページコンポーネント
 * @returns ホームページのJSX
 */
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Heyvite
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          パーティーやイベントの招待状を簡単に作成・管理できるアプリケーション
        </p>
      </header>

      <div className="max-w-4xl mx-auto">
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              招待状一覧
            </h2>
            <Button variant="primary">
              新しい招待状を作成
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InvitationCard
              title="誕生日パーティー"
              date="2024-12-25"
              location="東京都渋谷区"
              attendees={12}
            />
            <InvitationCard
              title="忘年会"
              date="2024-12-30"
              location="新宿居酒屋"
              attendees={25}
            />
          </div>
        </section>
      </div>
    </div>
  )
}