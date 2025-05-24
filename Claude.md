CLAUDE.md - プロジェクトガイドライン
このファイルはClaude Code GitHub Actionsがコードを生成・修正する際に従うべきガイドラインです。
🎯 プロジェクト概要
プロジェクトの目的
<!-- ここにプロジェクトの目的を記載 -->



主な技術スタック

言語: TypeScript 5.0+
フレームワーク: Next.js 14
スタイリング: Tailwind CSS
データベース: PostgreSQL
ORM: Prisma

📝 コーディング規約
一般的なルール

言語: TypeScriptを使用し、any型の使用は避ける
命名規則:

変数・関数: camelCase
クラス・型: PascalCase
定数: UPPER_SNAKE_CASE
ファイル名: kebab-case


インデント: スペース2つ
文字数制限: 1行100文字以内
コメント: 日本語で記載し、JSDocを使用

TypeScript固有のルール
typescript// ✅ 良い例
interface UserData {
  id: string;
  name: string;
  email: string;
}

// ❌ 悪い例
interface user_data {
  id: any;
  name: any;
}
🏗️ アーキテクチャ
ディレクトリ構造
src/
├── app/              # Next.js App Router
├── components/       # 再利用可能なコンポーネント
│   ├── ui/          # 基本的なUIコンポーネント
│   └── features/    # 機能別コンポーネント
├── lib/             # ユーティリティ関数
├── hooks/           # カスタムフック
├── services/        # API通信ロジック
├── types/           # 型定義
└── styles/          # グローバルスタイル
設計原則

単一責任の原則: 各コンポーネント/関数は1つの責任のみを持つ
DRY原則: コードの重複を避ける
早期リターン: ネストを減らすため、早期リターンを使用

🧪 テスト要件
テストの基準

すべての新機能に対してユニットテストを作成
重要なビジネスロジックには統合テストを追加
テストカバレッジ: 80%以上を維持

テストの書き方
typescript// Vitestを使用
describe('UserService', () => {
  it('should create a new user', async () => {
    // Arrange
    const userData = { name: '田中太郎', email: 'tanaka@example.com' };
    
    // Act
    const user = await createUser(userData);
    
    // Assert
    expect(user).toHaveProperty('id');
    expect(user.name).toBe('田中太郎');
  });
});
🔒 セキュリティ
必須のセキュリティ対策

環境変数を使用して機密情報を管理
SQLインジェクション対策（Prismaを使用）
XSS対策（React/Next.jsのデフォルト機能を活用）
認証にはNextAuthを使用
APIエンドポイントには適切な認証を実装

📦 依存関係の管理
パッケージ追加時の注意

新しいパッケージを追加する前に、既存のもので代替できないか確認
セキュリティの脆弱性がないか確認
定期的にnpm auditを実行

🚀 実装時の注意事項
Claudeへの指示

エラーハンドリング: すべての非同期処理にtry-catchを実装
ローディング状態: ユーザー操作には必ずローディング表示を追加
バリデーション: フォーム入力は必ずzodでバリデーション
型安全性: TypeScriptの型を最大限活用
パフォーマンス:

画像は最適化する（next/image使用）
大きなリストには仮想スクロールを検討



コードレビューのポイント

 TypeScriptの型が適切に定義されているか
 エラーハンドリングが実装されているか
 テストが書かれているか
 パフォーマンスの考慮がされているか
 セキュリティの考慮がされているか

💬 コミュニケーション
コメントの書き方
typescript/**
 * ユーザー情報を取得する
 * @param userId - ユーザーID
 * @returns ユーザー情報
 * @throws {NotFoundError} ユーザーが見つからない場合
 */
async function getUser(userId: string): Promise<User> {
  // 実装
}
Pull Request作成時

変更内容を簡潔に説明
破壊的変更がある場合は明記
関連するIssue番号を記載

🎨 UI/UXガイドライン
デザイン原則

モバイルファースト
アクセシビリティを考慮（WCAG 2.1 AA準拠）
ダークモード対応
レスポンシブデザイン

コンポーネント実装
tsx// ✅ 良い例：アクセシブルなボタン
<button
  onClick={handleClick}
  disabled={isLoading}
  aria-label="保存"
  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
>
  {isLoading ? <Spinner /> : '保存'}
</button>
📋 その他の注意事項

ブランチ戦略: Git Flow を採用
コミットメッセージ: Conventional Commits形式を使用
環境: development, staging, production の3環境
CI/CD: GitHub Actionsで自動テスト・デプロイ


このガイドラインに従ってコードを生成・修正してください。不明な点がある場合は、安全側に倒して実装し、コメントで補足説明を追加してください。
