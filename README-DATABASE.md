# データベース設定ガイド

## 📋 概要
このガイドでは、PRProプロジェクトのデータベース環境（PostgreSQL + Redis）の設定方法を説明します。

## 🚀 自動セットアップ（推奨）

### 1. スクリプトを使用した自動セットアップ
```bash
# スクリプトを実行可能にする
chmod +x scripts/setup-db.sh

# データベース環境を自動セットアップ
./scripts/setup-db.sh
```

このスクリプトは以下を自動実行します：
- Docker/Docker Composeの確認
- 依存関係のインストール
- データベースコンテナの起動
- Prismaスキーマの適用
- デモデータの投入
- 接続テスト

## 🔧 手動セットアップ

### 1. 必要なツールの確認
```bash
# Docker & Docker Composeが必要
docker --version
docker-compose --version

# Node.js 18以上が必要
node --version
npm --version
```

### 2. 環境変数の設定
```bash
# 環境変数ファイルをコピー
cp .env.example .env.local

# .env.localを編集（必要に応じて）
# DATABASE_URLはDocker環境用に設定済み
```

### 3. 依存関係のインストール
```bash
npm install
```

### 4. データベースの起動
```bash
# PostgreSQL + Redis + Adminerを起動
npm run docker:up

# または手動で
docker-compose up -d
```

### 5. Prismaの設定
```bash
# Prismaクライアントを生成
npx prisma generate

# データベーススキーマを適用
npx prisma db push

# デモデータを投入
npx prisma db seed
```

## 🗄️ データベース構造

### テーブル一覧
- **users** - ユーザー管理
- **projects** - プロジェクト管理
- **events** - イベント管理
- **files** - ファイル管理
- **schedule_slots** - 日程調整枠
- **bookings** - 予約管理
- **notifications** - 通知管理
- **refresh_tokens** - 認証トークン

### 主要なENUM型
- `UserRole`: SUPER_ADMIN, ADMIN, USER, GUEST
- `ProjectStatus`: DRAFT, ACTIVE, COMPLETED, ARCHIVED
- `FileCategory`: OFFICIAL_MATERIALS, PRESS_RELEASE, IMAGES, VIDEOS, DOCUMENTS, PROPOSALS
- `ApprovalStatus`: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, REVISION_REQUESTED

## 🔍 アクセス情報

### PostgreSQL
- **ホスト**: localhost:5432
- **データベース**: prpro
- **ユーザー名**: prpro_user
- **パスワード**: prpro_password

### Redis
- **ホスト**: localhost:6379
- **認証**: なし

### Adminer（データベースUI）
- **URL**: http://localhost:8080
- **システム**: PostgreSQL
- **サーバー**: postgres
- **ユーザー名**: prpro_user
- **パスワード**: prpro_password

## 👤 デモアカウント

セットアップ完了後、以下のアカウントでログインできます：

| 役割 | メールアドレス | パスワード |
|------|----------------|------------|
| 管理者 | admin@prpro.com | admin123456 |
| 一般ユーザー | demo@example.com | user123456 |
| メディア担当 | media@example.com | user123456 |

## 🛠️ 便利なコマンド

### データベース操作
```bash
# データベースを起動
npm run docker:up

# データベースを停止
npm run docker:down

# Prisma Studioを開く（データベースUI）
npm run db:studio

# データベースをリセット
npm run db:reset

# マイグレーションを作成
npm run db:migrate

# スキーマを適用
npm run db:push
```

### 開発用コマンド
```bash
# 開発サーバーを起動
npm run dev

# 型チェック
npm run typecheck

# リント
npm run lint

# テスト実行
npm test
```

## ⚠️ トラブルシューティング

### 1. Docker関連のエラー
```bash
# Dockerが起動しているか確認
docker ps

# コンテナのログを確認
docker-compose logs postgres
docker-compose logs redis

# コンテナを再起動
docker-compose restart
```

### 2. データベース接続エラー
```bash
# PostgreSQLの接続テスト
docker-compose exec postgres pg_isready -U prpro_user -d prpro

# Redisの接続テスト
docker-compose exec redis redis-cli ping
```

### 3. Prismaエラー
```bash
# Prismaクライアントを再生成
npx prisma generate

# スキーマを再適用
npx prisma db push --force-reset

# 開発環境をリセット
npm run db:reset
```

### 4. ポート競合エラー
別のアプリケーションが同じポートを使用している場合：
```bash
# 使用中のポートを確認
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :8080  # Adminer

# docker-compose.ymlでポートを変更してください
```

## 📚 参考リンク

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 🔒 セキュリティ注意事項

### 本番環境での注意点
1. **パスワードの変更**: デフォルトのパスワードは必ず変更
2. **ファイアウォール設定**: 必要なポートのみ開放
3. **SSL/TLS設定**: データベース接続の暗号化
4. **バックアップ設定**: 定期的なデータバックアップ
5. **ログ監視**: 不正アクセスの検知

### 開発環境での注意点
- `.env.local`ファイルをGitにコミットしない
- 本番用認証情報を開発環境で使用しない
- 定期的な依存関係の更新