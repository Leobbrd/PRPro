CLAUDE.md - プロジェクトガイドライン
このファイルはClaude Code GitHub Actionsがコードを生成・修正する際に従うべきガイドラインです。
PR会社用調整Webサービス 要件定義書
📋 プロジェクト概要
プロジェクト名
PR Agency Coordination Platform (PACP)
目的
PR会社とクライアント間の調整業務を効率化し、プロジェクト管理を一元化するWebサービス
対象ユーザー

管理者: PR会社スタッフ
利用者: プロジェクト関係者（メディア、クライアント企業等）


🎯 機能要件
1. 認証・ユーザー管理
1.1 ログイン機能

エンドポイント: POST /api/auth/login
機能: メールアドレス・パスワード認証
レスポンス: JWTトークン発行
セッション管理: Redis使用
パスワード要件: 8文字以上、英数記号混在

1.2 ユーザー登録

エンドポイント: POST /api/auth/register
メール認証: 24時間有効なトークン
初期権限: 利用者権限（管理者は手動昇格）

1.3 権限管理
javascript// 権限レベル定義
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',    // システム管理者
  ADMIN: 'admin',                // PR会社管理者
  USER: 'user',                  // 一般利用者
  GUEST: 'guest'                 // 閲覧のみ
}
2. プロジェクト管理機能
2.1 プロジェクト作成

データモデル:

javascriptconst ProjectSchema = {
  id: 'UUID',
  name: 'String(100)',
  description: 'Text',
  status: 'Enum[draft, active, completed, archived]',
  admin_id: 'UUID',
  unique_url: 'String(50)', // 自動生成
  created_at: 'DateTime',
  updated_at: 'DateTime',
  settings: {
    schedule_adjustment_enabled: 'Boolean',
    auto_approval: 'Boolean',
    deadline_notifications: 'Boolean'
  }
}
2.2 URL生成機能

フォーマット: https://domain.com/project/{unique_code}
コード生成: 8桁英数字ランダム
重複チェック: 必須

3. イベント管理機能
3.1 イベント概要登録

データモデル:

javascriptconst EventSchema = {
  id: 'UUID',
  project_id: 'UUID',
  title: 'String(200)',
  description: 'Text',
  event_date: 'DateTime',
  venue: 'String(200)',
  capacity: 'Integer',
  requirements: 'Text',
  status: 'Enum[planning, confirmed, cancelled]'
}
4. ファイル管理機能
4.1 素材アップロード

対応形式: PDF, DOC, DOCX, JPG, PNG, MP4 (最大100MB)
ストレージ: AWS S3 / Google Cloud Storage
アクセス制御: 署名付きURL (24時間有効)

4.2 ファイル分類
javascriptconst FILE_CATEGORIES = {
  OFFICIAL_MATERIALS: 'official_materials',
  PRESS_RELEASE: 'press_release',
  IMAGES: 'images',
  VIDEOS: 'videos',
  DOCUMENTS: 'documents',
  PROPOSALS: 'proposals'
}
5. 承認ワークフロー
5.1 提出物管理

ステータス管理:

javascriptconst APPROVAL_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION_REQUESTED: 'revision_requested'
}
5.2 期限管理

通知タイミング: 3日前、1日前、当日、期限超過
エスカレーション: 期限超過24時間後に上位管理者へ通知

6. 日程調整機能
6.1 スケジュール管理

データモデル:

javascriptconst ScheduleSlotSchema = {
  id: 'UUID',
  project_id: 'UUID',
  start_time: 'DateTime',
  end_time: 'DateTime',
  capacity: 'Integer',
  booked_count: 'Integer',
  status: 'Enum[available, full, blocked]'
}
6.2 予約システム

同時予約制御: 楽観的ロック使用
キャンセル機能: 開始24時間前まで可能

7. 通知システム
7.1 通知種別
javascriptconst NOTIFICATION_TYPES = {
  DEADLINE_REMINDER: 'deadline_reminder',
  APPROVAL_REQUEST: 'approval_request',
  STATUS_UPDATE: 'status_update',
  SCHEDULE_CONFIRMATION: 'schedule_confirmation',
  SYSTEM_ALERT: 'system_alert'
}
7.2 配信方法

Web通知: リアルタイム (WebSocket)
メール通知: 重要通知のみ
設定可能: ユーザー個別設定


🏗️ 技術仕様
フロントエンド

フレームワーク: React 18+ / Next.js 14+
状態管理: Zustand / Redux Toolkit
UI ライブラリ: Material-UI / Tailwind CSS
認証: NextAuth.js
バリデーション: React Hook Form + Zod

バックエンド

言語: Node.js (TypeScript)
フレームワーク: Express.js / Fastify
ORM: Prisma / TypeORM
認証: JWT + Refresh Token
ファイルアップロード: Multer + Sharp (画像処理)

データベース

メインDB: PostgreSQL 15+
キャッシュ: Redis 7+
ファイルストレージ: AWS S3 / Cloudflare R2

インフラ

本番環境: AWS / Vercel
CI/CD: GitHub Actions
監視: Sentry + LogRocket
CDN: CloudFront / Cloudflare


📊 データベース設計
核となるテーブル構造
sql-- ユーザーテーブル
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- プロジェクトテーブル
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    unique_url VARCHAR(50) UNIQUE NOT NULL,
    admin_id UUID REFERENCES users(id),
    status project_status DEFAULT 'draft',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ファイルテーブル
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    uploaded_by UUID REFERENCES users(id),
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    category file_category NOT NULL,
    approval_status approval_status DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

🔒 セキュリティ要件
認証・認可

JWT有効期限: アクセストークン15分、リフレッシュトークン7日
CORS設定: 本番ドメインのみ許可
レート制限: API毎分60リクエスト/IP

データ保護

暗号化: 保存時AES-256、転送時TLS1.3
個人情報: GDPR準拠のデータ処理
ログ管理: 個人情報除外、90日保持

ファイルセキュリティ

ウイルススキャン: ClamAV統合
アクセス制御: 署名付きURL使用
ファイル検証: MIMEタイプ厳密チェック


🚀 API仕様
認証API
javascript// ログイン
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, refreshToken: string, user: UserObject }

// トークン更新
POST /api/auth/refresh
Body: { refreshToken: string }
Response: { token: string }
プロジェクトAPI
javascript// プロジェクト作成
POST /api/projects
Headers: { Authorization: "Bearer {token}" }
Body: { name: string, description: string }
Response: { project: ProjectObject, uniqueUrl: string }

// プロジェクト一覧
GET /api/projects
Headers: { Authorization: "Bearer {token}" }
Query: { page: number, limit: number, status?: string }
Response: { projects: ProjectObject[], total: number }
ファイルAPI
javascript// ファイルアップロード
POST /api/files/upload
Headers: { Authorization: "Bearer {token}" }
Body: FormData { file: File, projectId: string, category: string }
Response: { file: FileObject }

// ファイル承認
PATCH /api/files/{fileId}/approve
Headers: { Authorization: "Bearer {token}" }
Body: { status: 'approved' | 'rejected', comment?: string }
Response: { file: FileObject }

📱 UI/UX要件
レスポンシブデザイン

ブレークポイント:

モバイル: ~768px
タブレット: 768px~1024px
デスクトップ: 1024px~



アクセシビリティ

WCAG 2.1 AA準拠
キーボードナビゲーション対応
スクリーンリーダー対応

パフォーマンス

First Contentful Paint: < 1.5秒
Largest Contentful Paint: < 2.5秒
Cumulative Layout Shift: < 0.1


🧪 テスト要件
自動テスト

単体テスト: Jest (カバレッジ80%以上)
統合テスト: Supertest
E2Eテスト: Playwright
負荷テスト: Artillery.js

手動テスト

ユーザビリティテスト: 各機能リリース前
セキュリティテスト: ペネトレーションテスト
ブラウザテスト: Chrome, Firefox, Safari, Edge


📈 運用要件
監視・ログ

アプリケーションログ: Winston
エラー監視: Sentry
パフォーマンス監視: New Relic
稼働監視: Uptime Robot

バックアップ

データベース: 毎日自動バックアップ
ファイル: S3クロスリージョンレプリケーション
復旧テスト: 月1回実施

スケーラビリティ

水平スケーリング: Dockerコンテナ対応
負荷分散: Application Load Balancer
キャッシュ戦略: Redis + CDNキャッシュ


📅 開発スケジュール
Phase 1: 基盤開発 (4週間)

認証システム
基本的なプロジェクト管理
ファイルアップロード機能

Phase 2: コア機能 (6週間)

承認ワークフロー
日程調整機能
通知システム

Phase 3: 高度機能 (4週間)

レポート機能
モバイル最適化
パフォーマンス改善

Phase 4: リリース準備 (2週間)

セキュリティ監査
パフォーマンステスト
本番環境構築


💰 運用コスト概算
インフラコスト (月額)

AWS EC2: $200-400
RDS PostgreSQL: $150-300
S3 + CloudFront: $50-100
Redis ElastiCache: $100-200
総計: $500-1000/月

サードパーティサービス

Sentry: $26/月
SendGrid: $15-100/月
監視ツール: $50-200/月


🔧 開発環境セットアップ
必要なツール
bash# Node.js環境
node --version  # v18.17.0+
npm --version   # v9.0.0+

# データベース
postgresql     # v15+
redis         # v7+

# 開発ツール
git
docker
docker-compose
環境変数設定
bash# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/pacp"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-key"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
S3_BUCKET_NAME="pacp-files"
