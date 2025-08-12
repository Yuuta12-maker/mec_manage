import { NextResponse } from 'next/server';
import { getPublishableKey, getCurrentEnvironment } from '@/lib/stripe-test';

export async function GET() {
  try {
    const publishableKey = getPublishableKey();
    const environment = getCurrentEnvironment();
    
    if (!publishableKey) {
      return NextResponse.json(
        { error: 'Stripe publishable key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publishableKey,
      environment,
    });
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return NextResponse.json(
      { error: 'Failed to get Stripe configuration' },
      { status: 500 }
    );
  }
}