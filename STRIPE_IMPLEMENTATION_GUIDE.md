# MEC管理システム Stripe決済機能実装ガイド

## 概要
MEC（マインドエンジニアリング・コーチング）管理システムにStripe決済機能を統合し、継続プログラムの申し込み時に自動決済を可能にする実装ガイドです。

## 目次
1. [事前準備](#事前準備)
2. [Stripe設定](#stripe設定)
3. [パッケージインストール](#パッケージインストール)
4. [環境変数設定](#環境変数設定)
5. [データベース拡張](#データベース拡張)
6. [アプリケーション実装](#アプリケーション実装)
7. [Webhook実装](#webhook実装)
8. [セキュリティ対策](#セキュリティ対策)
9. [テスト手順](#テスト手順)
10. [本番環境デプロイ](#本番環境デプロイ)

---

## 事前準備

### 現在の決済フロー分析
現在のシステムでは継続申し込み時（`/apply/continue`）に手動での支払い方法選択のみで、自動決済機能は未実装です。

### 実装対象
- 継続プログラム申し込み時の決済処理
- 決済完了後の自動セッション予約承認
- 決済状況の管理画面表示
- 決済失敗時のリトライ機能

---

## Stripe設定

### 1. Stripeアカウント作成
1. [stripe.com](https://stripe.com) でアカウント作成
2. 事業者情報登録（法人/個人事業主）
3. 銀行口座情報登録
4. 本人確認書類提出

### 2. APIキー取得
**ダッシュボード > 開発者 > APIキー**

- **公開可能キー** (pk_test_xxx): フロントエンド用
- **シークレットキー** (sk_test_xxx): サーバーサイド用

### 3. 商品・価格設定
**ダッシュボード > 商品**

1. 商品作成:
   - **名前**: "MEC 6回継続プログラム"
   - **説明**: "マインドエンジニアリング・コーチング 6回セッション"

2. 価格設定:
   - **金額**: 50,000円（設定に応じて調整）
   - **通貨**: JPY
   - **課金タイプ**: 一回限り
   - **価格ID**: `price_xxx` (後で使用)

### 4. Webhook設定
**ダッシュボード > 開発者 > Webhook**

1. エンドポイント追加:
   - **URL**: `https://yourdomain.com/api/stripe/webhook`
   - **イベント**: 
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

2. Webhook署名シークレット (`whsec_xxx`) を保存

---

## パッケージインストール

```bash
# Stripe関連パッケージ
npm install stripe @stripe/stripe-js

# 型定義
npm install --save-dev @types/stripe
```

---

## 環境変数設定

### .env.local
```env
# Stripe設定
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 本番環境用
```env
# 本番用キーに変更
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## データベース拡張

### continuation_applications テーブル拡張

```sql
-- 決済情報フィールド追加
ALTER TABLE continuation_applications 
ADD COLUMN stripe_checkout_session_id VARCHAR(255),
ADD COLUMN stripe_payment_intent_id VARCHAR(255),
ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN payment_amount INTEGER,
ADD COLUMN payment_currency VARCHAR(3) DEFAULT 'JPY',
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;

-- インデックス追加
CREATE INDEX idx_continuation_applications_stripe_checkout ON continuation_applications(stripe_checkout_session_id);
CREATE INDEX idx_continuation_applications_payment_status ON continuation_applications(payment_status);
```

### payment_transactions テーブル作成

```sql
-- 決済履歴テーブル
CREATE TABLE payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    continuation_application_id UUID REFERENCES continuation_applications(id),
    stripe_checkout_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'JPY',
    status VARCHAR(50) NOT NULL,
    payment_method_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_payment_transactions_application ON payment_transactions(continuation_application_id);
CREATE INDEX idx_payment_transactions_stripe_session ON payment_transactions(stripe_checkout_session_id);
```

---

## アプリケーション実装

### 1. Stripe設定ファイル

#### `/src/lib/stripe.ts`
```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount);
};

export const formatAmountFromStripe = (amount: number): number => {
  return amount;
};
```

#### `/src/lib/stripe-client.ts`
```typescript
import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<any>;

export const getStripe = () => {
  if (!stripePromise) {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
    }
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};
```

### 2. Checkout Session API

#### `/src/app/api/stripe/create-checkout-session/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { continuationApplicationId } = await request.json();

    if (!continuationApplicationId) {
      return NextResponse.json(
        { error: 'Continuation application ID is required' },
        { status: 400 }
      );
    }

    // 継続申し込み情報を取得
    const supabase = createClient();
    const { data: application, error } = await supabase
      .from('continuation_applications')
      .select('*, clients(*)')
      .eq('id', continuationApplicationId)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/apply/continue/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/apply/continue?application_id=${continuationApplicationId}`,
      metadata: {
        continuation_application_id: continuationApplicationId,
        client_email: application.clients.email,
      },
      customer_email: application.clients.email,
    });

    // セッションIDをデータベースに保存
    await supabase
      .from('continuation_applications')
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: 'pending',
      })
      .eq('id', continuationApplicationId);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### 3. 継続申し込み画面の更新

#### `/src/app/apply/continue/page.tsx` の決済部分追加
```typescript
// 既存のコードに以下を追加

import { getStripe } from '@/lib/stripe-client';

// 決済処理関数
const handlePayment = async (continuationApplicationId: string) => {
  try {
    setIsSubmitting(true);
    
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        continuationApplicationId,
      }),
    });

    const { sessionId } = await response.json();
    
    const stripe = await getStripe();
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Payment error:', error);
    setError('決済処理中にエラーが発生しました。');
  } finally {
    setIsSubmitting(false);
  }
};

// フォーム送信処理を修正
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 継続申し込みデータを保存
  const applicationResponse = await fetch('/api/apply/continue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  
  const { applicationId } = await applicationResponse.json();
  
  // 決済画面にリダイレクト
  await handlePayment(applicationId);
};
```

### 4. 決済成功画面の更新

#### `/src/app/apply/continue/success/page.tsx`
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ContinueSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (sessionId) {
      // 決済ステータスを確認
      fetch(`/api/stripe/verify-payment?session_id=${sessionId}`)
        .then(response => response.json())
        .then(data => {
          setPaymentStatus(data.success ? 'success' : 'error');
        })
        .catch(() => setPaymentStatus('error'));
    }
  }, [sessionId]);

  if (paymentStatus === 'loading') {
    return <div>決済確認中...</div>;
  }

  if (paymentStatus === 'error') {
    return <div>決済に失敗しました。お手数ですが、もう一度お試しください。</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-green-600 mb-6">
        決済が完了しました！
      </h1>
      <p className="mb-4">
        MEC 6回継続プログラムへのお申し込みありがとうございます。
      </p>
      <p className="mb-4">
        決済が正常に処理され、お申し込みが承認されました。
        近日中に最初のセッションの日程調整についてご連絡いたします。
      </p>
    </div>
  );
}
```

---

## Webhook実装

### `/src/app/api/stripe/webhook/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, supabase);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, supabase);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, supabase);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: any, supabase: any) {
  const applicationId = session.metadata.continuation_application_id;

  // 継続申し込みのステータスを更新
  await supabase
    .from('continuation_applications')
    .update({
      status: 'approved',
      payment_status: 'completed',
      stripe_payment_intent_id: session.payment_intent,
      payment_amount: session.amount_total,
      paid_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  // 決済履歴を記録
  await supabase
    .from('payment_transactions')
    .insert({
      continuation_application_id: applicationId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      amount: session.amount_total,
      currency: session.currency,
      status: 'succeeded',
      payment_method_type: 'card',
    });
}

async function handlePaymentIntentSucceeded(paymentIntent: any, supabase: any) {
  // 必要に応じて追加処理
  console.log('Payment succeeded:', paymentIntent.id);
}

async function handlePaymentIntentFailed(paymentIntent: any, supabase: any) {
  // 決済失敗時の処理
  await supabase
    .from('continuation_applications')
    .update({
      payment_status: 'failed',
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);
}
```

### 決済確認API

#### `/src/app/api/stripe/verify-payment/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return NextResponse.json({
      success: session.payment_status === 'paid',
      status: session.payment_status,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
```

---

## セキュリティ対策

### 1. 環境変数保護
- `.env.local` をgitignoreに追加
- 本番環境では環境変数を安全に管理
- APIキーの定期的なローテーション

### 2. Webhook検証
```typescript
// 必ずWebhook署名を検証
event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

### 3. CSRF対策
```typescript
// APIルートでOriginヘッダーを確認
const origin = request.headers.get('origin');
if (origin !== process.env.NEXT_PUBLIC_APP_URL) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### 4. レート制限
```typescript
// 必要に応じてレート制限を実装
import rateLimit from 'express-rate-limit';
```

---

## テスト手順

### 1. テスト用カード情報
```
カード番号: 4242424242424242
有効期限: 任意の未来の日付
CVC: 任意の3桁
郵便番号: 任意
```

### 2. 決済フローテスト
1. 継続申し込みフォーム入力
2. Stripe Checkoutページ表示確認
3. テストカードで決済実行
4. 成功ページリダイレクト確認
5. データベース更新確認
6. Webhook受信確認

### 3. エラーケーステスト
```
# 決済失敗テスト用カード
カード番号: 4000000000000002
```

### 4. 自動テストスクリプト
```typescript
// __tests__/stripe-integration.test.ts
import { stripe } from '@/lib/stripe';

describe('Stripe Integration', () => {
  test('should create checkout session', async () => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    });
    
    expect(session.id).toBeDefined();
    expect(session.url).toBeDefined();
  });
});
```

---

## 本番環境デプロイ

### 1. 環境変数設定
```bash
# Vercel例
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_PRICE_ID
```

### 2. Webhook URL更新
- Stripeダッシュボードで本番用WebhookURL設定
- `https://yourdomain.com/api/stripe/webhook`

### 3. 本番テスト
1. 少額での実決済テスト
2. Webhook動作確認
3. メール送信テスト
4. データベース更新確認

### 4. 監視・ログ設定
```typescript
// 決済関連のログ出力
console.log('Payment processing:', {
  sessionId: session.id,
  amount: session.amount_total,
  customer: session.customer_email,
});
```

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. Webhook受信失敗
```bash
# ログ確認
vercel logs --app=your-app-name

# Webhook再送信
# Stripeダッシュボード > 開発者 > Webhook > イベント
```

#### 2. 決済失敗時の対応
```typescript
// リトライ機能の実装
const retryPayment = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== 'paid') {
    // 新しいセッションを作成してリトライ
  }
};
```

#### 3. 重複決済防止
```typescript
// 冪等性キーを使用
const session = await stripe.checkout.sessions.create({
  // ...
}, {
  idempotencyKey: `continue_app_${applicationId}`,
});
```

---

## 参考資料

### 公式ドキュメント
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

### Next.js Stripe統合
- [Next.js Stripe Example](https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript)

### セキュリティ
- [Stripe Security](https://stripe.com/docs/security)
- [PCI Compliance](https://stripe.com/docs/security/guide)

---

## 実装チェックリスト

### Stripe設定
- [ ] Stripeアカウント作成・認証完了
- [ ] 商品・価格設定完了
- [ ] Webhook設定完了
- [ ] APIキー取得完了

### アプリケーション実装
- [ ] パッケージインストール完了
- [ ] 環境変数設定完了
- [ ] データベーススキーマ更新完了
- [ ] Stripe設定ファイル作成完了
- [ ] Checkout Session API実装完了
- [ ] 継続申し込み画面更新完了
- [ ] 決済成功画面実装完了
- [ ] Webhook実装完了

### テスト
- [ ] テスト決済フロー動作確認
- [ ] Webhook受信確認
- [ ] エラーケーステスト完了
- [ ] データベース更新確認

### デプロイ
- [ ] 本番環境変数設定完了
- [ ] 本番Webhook URL設定完了
- [ ] 本番テスト完了
- [ ] 監視・ログ設定完了

---

この実装ガイドに従って、段階的にStripe決済機能を統合することができます。何か不明な点があれば、各セクションの詳細について追加説明いたします。