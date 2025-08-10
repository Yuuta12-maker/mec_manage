# Google Meet自動生成機能セットアップガイド

## 概要
セッション予約時に自動でGoogle Meetリンクを生成し、クライアントへの返信メールに組み込む機能を実装しました。

## 実装内容

### 1. 新しいファイル
- `src/lib/google-meet.ts` - Google Calendar API統合とMeetリンク生成
- `src/app/api/create-meet-link/route.ts` - Meetリンク生成APIエンドポイント
- `src/app/api/test-google-calendar/route.ts` - Google Calendar接続テスト用API
- `add_meet_link_to_sessions.sql` - sessionsテーブルにmeet_linkカラムを追加するSQL

### 2. 更新されたファイル
- `src/app/booking/page.tsx` - 予約時にMeetリンク生成機能を追加
- `src/lib/gmail.ts` - メール内容にMeetリンクを適切に表示
- `.env.example` - Google Calendar API設定を追加
- `package.json` - googleapis依存関係を追加

## セットアップ手順

### 1. Google Cloud Projectの設定

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. Google Calendar APIを有効化
   - APIとサービス > ライブラリ > Google Calendar API > 有効にする

### 2. OAuth 2.0認証情報の設定

1. APIとサービス > 認証情報 > 認証情報を作成 > OAuth 2.0 クライアントID
2. アプリケーションの種類：「ウェブアプリケーション」
3. 承認済みのリダイレクトURI：
   - 開発環境：`http://localhost:3000`
   - 本番環境：あなたのドメイン
4. クライアントIDとクライアントシークレットをメモ

### 3. リフレッシュトークンの取得

以下のいずれかの方法でリフレッシュトークンを取得：

#### 方法A: Google OAuth 2.0 Playground
1. [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)にアクセス
2. 設定アイコン > Use your own OAuth credentials にチェック
3. OAuth Client IDとOAuth Client secretを入力
4. Step 1：Scope selection
   - `https://www.googleapis.com/auth/calendar` を選択
5. "Authorize APIs"をクリック
6. Googleアカウントでログイン・承認
7. Step 2："Exchange authorization code for tokens"をクリック
8. refresh_tokenをコピー

#### 方法B: プログラムで取得
```javascript
// OAuth URLを生成してブラウザでアクセス
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/calendar'],
});
// 承認後にコードを取得してトークンと交換
```

### 4. 環境変数の設定

`.env.local`ファイルに以下を追加：

```env
# Google Calendar API Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

### 5. データベースの更新

以下のSQLを実行してsessionsテーブルにmeet_linkカラムを追加：

```sql
ALTER TABLE sessions ADD COLUMN meet_link TEXT;
```

またはSupabaseのSQL Editorで`add_meet_link_to_sessions.sql`の内容を実行。

### 6. 動作確認

1. Google Calendar API接続テスト：
   ```
   GET /api/test-google-calendar
   ```

2. 実際の予約フローでテスト：
   - セッション予約ページで「オンライン（Google Meet）」を選択
   - 予約完了後、メールにMeetリンクが含まれることを確認
   - セッション詳細画面でMeetリンクが表示されることを確認

## 注意事項

### セキュリティ
- リフレッシュトークンは絶対に公開しないでください
- 環境変数は`.env.local`に保存し、`.gitignore`で除外されていることを確認

### 権限
- Google Calendar APIの利用には適切なOAuthスコープが必要
- カレンダーへの書き込み権限が必要

### トラブルシューティング

1. **「Missing Google Calendar API credentials」エラー**
   - 環境変数が正しく設定されているか確認
   - `.env.local`ファイルがプロジェクトルートに存在するか確認

2. **「Invalid credentials」エラー**
   - クライアントIDとシークレットが正しいか確認
   - リフレッシュトークンが有効か確認

3. **「Calendar API not enabled」エラー**
   - Google Cloud ConsoleでCalendar APIが有効化されているか確認

4. **Meetリンクが生成されない**
   - Google Workspace（旧G Suite）アカウントが必要な場合があります
   - 個人のGoogleアカウントでも利用可能ですが、一部制限がある可能性があります

## オプション機能

### 手動でMeetリンクを設定
Google Calendar API が設定されていない場合でも、セッション詳細画面からMeetリンクを手動で設定できます。

### APIエンドポイント
- `POST /api/create-meet-link` - Meetリンク生成
- `GET /api/test-google-calendar` - 接続テスト

## 今後の改善案

1. **エラーハンドリングの向上**
   - API制限に達した場合の適切な処理
   - 部分的失敗時のフォールバック機能

2. **UI/UXの改善**
   - Meetリンク生成状況の表示
   - 設定状況の管理画面

3. **機能拡張**
   - カレンダーイベントの更新・削除
   - 複数カレンダーへの対応
   - リマインダー機能