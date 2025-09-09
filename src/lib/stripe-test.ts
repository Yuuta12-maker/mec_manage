import Stripe from 'stripe';

// 環境切り替え用フラグ（環境変数から取得）
export const useTestEnvironment = process.env.STRIPE_USE_TEST === 'true';

// テスト環境用のStripeクライアント
const stripeTestSecretKey = process.env.STRIPE_TEST_SECRET_KEY;
const stripeProductionSecretKey = process.env.STRIPE_SECRET_KEY;

// テスト用Stripeクライアント
export const stripeTest = stripeTestSecretKey ? new Stripe(stripeTestSecretKey, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
}) : null;

// 動的にStripeクライアントを選択
export const getStripeClient = () => {
  if (useTestEnvironment && stripeTest) {
    console.log('🧪 Using Stripe TEST environment');
    return stripeTest;
  }
  
  // 本番用stripeを使用
  if (stripeProductionSecretKey) {
    console.log('🚀 Using Stripe PRODUCTION environment');
    const stripe = new Stripe(stripeProductionSecretKey, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    });
    return stripe;
  }
  
  throw new Error('No Stripe configuration found');
};

// 現在の環境を取得
export const getCurrentEnvironment = () => {
  return useTestEnvironment ? 'test' : 'production';
};

// テスト用公開キーを取得
export const getPublishableKey = () => {
  return useTestEnvironment 
    ? process.env.STRIPE_TEST_CLIENT_KEY
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
};

// Webhook署名シークレットを取得
export const getWebhookSecret = () => {
  return useTestEnvironment
    ? process.env.STRIPE_TEST_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET;
};