import { NextResponse } from 'next/server';
import { useTestEnvironment, getCurrentEnvironment, getWebhookSecret } from '@/lib/stripe-test';

export async function GET() {
  try {
    const environment = getCurrentEnvironment();
    const isTest = useTestEnvironment;
    const webhookSecret = getWebhookSecret();
    
    return NextResponse.json({
      environment,
      isTest,
      hasTestWebhookSecret: !!process.env.STRIPE_TEST_WEBHOOK_SECRET,
      hasProdWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretPrefix: webhookSecret?.substring(0, 10) + '...',
      currentWebhookSecret: webhookSecret ? 'configured' : 'missing'
    });
  } catch (error) {
    console.error('Webhook debug error:', error);
    return NextResponse.json({
      error: 'Webhook debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}