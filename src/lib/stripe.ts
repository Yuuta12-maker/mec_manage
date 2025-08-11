import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export const formatAmountForStripe = (amount: number): number => {
  // Convert to smallest currency unit (yen doesn't need multiplication)
  return Math.round(amount);
};

export const formatAmountFromStripe = (amount: number): number => {
  // Convert from smallest currency unit
  return amount;
};

export const formatCurrency = (amount: number, currency: string = 'JPY'): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Stripe エラーメッセージの日本語化
export const getStripeErrorMessage = (error: Stripe.StripeError): string => {
  switch (error.code) {
    case 'card_declined':
      return 'カードが拒否されました。別のカードをお試しください。';
    case 'insufficient_funds':
      return '残高不足です。';
    case 'expired_card':
      return 'カードの有効期限が切れています。';
    case 'incorrect_cvc':
      return 'セキュリティコードが正しくありません。';
    case 'processing_error':
      return '決済処理中にエラーが発生しました。しばらく時間をおいてからお試しください。';
    case 'rate_limit':
      return 'リクエストが多すぎます。しばらく時間をおいてからお試しください。';
    default:
      return '決済処理中にエラーが発生しました。お手数ですが、もう一度お試しください。';
  }
};

// デフォルト価格設定
export const DEFAULT_PROGRAM_PRICE = 50000; // 50,000円
export const DEFAULT_TRIAL_PRICE = 6000; // 6,000円
export const DEFAULT_CURRENCY = 'JPY';