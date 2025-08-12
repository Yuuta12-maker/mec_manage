'use client';

import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

// APIから公開キーを動的取得
const getPublishableKey = async (): Promise<string> => {
  try {
    const response = await fetch('/api/stripe/config');
    const data = await response.json();
    
    if (!response.ok || !data.publishableKey) {
      throw new Error('Failed to get publishable key');
    }
    
    console.log(`🔧 Using Stripe ${data.environment} environment`);
    return data.publishableKey;
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    // フォールバック: 本番用キー
    const fallbackKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!fallbackKey) {
      throw new Error('No Stripe publishable key available');
    }
    return fallbackKey;
  }
};

export const getStripe = async (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = (async () => {
      try {
        const publishableKey = await getPublishableKey();
        return await loadStripe(publishableKey, {
          locale: 'ja',
        });
      } catch (error) {
        console.error('Failed to load Stripe:', error);
        return null;
      }
    })();
  }
  
  return stripePromise;
};

export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Stripe failed to load');
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    throw new Error(error.message);
  }
};