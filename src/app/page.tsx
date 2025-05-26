import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            PR Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            PR会社とクライアント間の調整業務を効率化し、プロジェクト管理を一元化するWebサービス
          </p>
          
          <div className="space-x-4">
            <Link href="/auth/login" className="btn-primary">
              ログイン
            </Link>
            <Link href="/auth/register" className="btn-secondary">
              新規登録
            </Link>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <h3 className="text-lg font-semibold mb-3">プロジェクト管理</h3>
            <p className="text-gray-600">
              プロジェクトの作成から進行管理まで一元化
            </p>
          </div>
          
          <div className="card text-center">
            <h3 className="text-lg font-semibold mb-3">ファイル共有</h3>
            <p className="text-gray-600">
              安全なファイルアップロードと承認ワークフロー
            </p>
          </div>
          
          <div className="card text-center">
            <h3 className="text-lg font-semibold mb-3">日程調整</h3>
            <p className="text-gray-600">
              効率的なスケジュール管理と予約システム
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}