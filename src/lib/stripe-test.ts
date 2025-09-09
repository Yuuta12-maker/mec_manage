import Stripe from 'stripe';

// Vercel環境での動的環境変数読み込み
const getEnvironmentVariable = (key: string): string | undefined => {
  // Node.js 環境変数から読み込み
  const value = process.env[key];
  console.log(`🔧 Environment variable ${key}:`, value ? `${value.slice(0, 8)}...` : 'undefined');
  return value;
};

// 環境切り替え用フラグ（環境変数から取得）
export const useTestEnvironment = getEnvironmentVariable('STRIPE_USE_TEST') === 'true';

// テスト環境用のStripeクライアント
const stripeTestSecretKey = getEnvironmentVariable('STRIPE_TEST_SECRET_KEY');
const stripeProductionSecretKey = getEnvironmentVariable('STRIPE_SECRET_KEY');

console.log('🌍 Stripe environment configuration:', {
  useTestEnvironment,
  hasTestKey: !!stripeTestSecretKey,
  hasProductionKey: !!stripeProductionSecretKey,
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV,
});

// 共通のStripe設定
const createStripeConfig = (): Stripe.StripeConfig => ({
  apiVersion: '2025-07-30.basil',
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 20000,
  telemetry: false,
});

// テスト用Stripeクライアント（遅延初期化）
let stripeTestInstance: Stripe | null = null;
let stripeProductionInstance: Stripe | null = null;

const getTestStripeClient = (): Stripe | null => {
  if (!stripeTestSecretKey) return null;
  if (!stripeTestInstance) {
    console.log('🧪 Initializing Stripe TEST client');
    stripeTestInstance = new Stripe(stripeTestSecretKey, createStripeConfig());
  }
  return stripeTestInstance;
};

const getProductionStripeClient = (): Stripe | null => {
  if (!stripeProductionSecretKey) return null;
  if (!stripeProductionInstance) {
    console.log('🚀 Initializing Stripe PRODUCTION client');
    stripeProductionInstance = new Stripe(stripeProductionSecretKey, createStripeConfig());
  }
  return stripeProductionInstance;
};

// 動的にStripeクライアントを選択
export const getStripeClient = (): Stripe => {
  console.log('🔍 Getting Stripe client, useTestEnvironment:', useTestEnvironment);
  
  if (useTestEnvironment) {
    const testClient = getTestStripeClient();
    if (testClient) {
      console.log('✅ Using Stripe TEST client');
      return testClient;
    } else {
      console.warn('⚠️ Test environment requested but no test key available, falling back to production');
    }
  }
  
  // 本番用stripeを使用
  const productionClient = getProductionStripeClient();
  if (productionClient) {
    console.log('✅ Using Stripe PRODUCTION client');
    return productionClient;
  }
  
  console.error('❌ No Stripe configuration available');
  throw new Error('No Stripe configuration found. Please check environment variables.');
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