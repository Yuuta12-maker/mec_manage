# MEC管理システム

マインドエンジニアリング・コーチングプログラムの運営管理システム

## 概要

MEC（マインドエンジニアリング・コーチング）管理システムは、コーチングプログラムの運営に必要な業務を一元管理するWebアプリケーションです。

### 主要機能

- **ダッシュボード**: 今週のセッション、クライアント状況の統計表示
- **クライアント管理**: 顧客情報の登録・編集・検索・フィルタリング
- **セッション管理**: セッション予約・実施管理・Google Meet連携
- **支払い管理**: 料金管理・支払いステータス追跡・売上統計

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **リアルタイム**: Supabase Realtime

## セットアップ

### 前提条件

- Node.js 18.x以上
- npm または yarn

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd mec_manage
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env.local
```

`.env.local`に以下を設定：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. 開発サーバーを起動
```bash
npm run dev
```

## 利用方法

### ログイン情報
- **メールアドレス**: mindengineeringcoaching@gmail.com
- **パスワード**: 1224yui1224

### プログラム料金体系
- **トライアル料金**: ¥6,000（税込）
- **継続プログラム料金**: ¥214,000（税込）
- **総額**: ¥220,000（税込）
- **期間**: 6ヶ月間、月1回×6回（各30分程度）

## データベース構造

### テーブル構成
- `clients`: クライアント情報
- `sessions`: セッション予約・実施情報
- `payments`: 支払い情報
- `settings`: システム設定

### クライアントステータス
- `applied`: 申込完了
- `trial_booked`: トライアル予約済
- `trial_completed`: トライアル完了
- `active`: 継続中
- `completed`: 完了
- `inactive`: 非アクティブ

## ビルド・デプロイ

### プロダクションビルド
```bash
npm run build
npm start
```

### Vercelデプロイ
```bash
npx vercel
```

## 開発者情報

- **作成者**: Claude (Anthropic)
- **作成日**: 2025年8月2日
- **対象システム**: MEC管理システム
- **技術責任者**: 森山雄太（ボス）

## ライセンス

このプロジェクトは私的利用のために作成されています。