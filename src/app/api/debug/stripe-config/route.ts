import { NextResponse } from 'next/server';
import { useTestEnvironment, getCurrentEnvironment } from '@/lib/stripe-test';

export async function GET() {
  try {
    const environment = getCurrentEnvironment();
    const isTest = useTestEnvironment;
    
    // 環境変数の存在確認（値は表示しない）
    const hasTestSecret = !!process.env.STRIPE_TEST_SECRET_KEY;
    const hasTestClient = !!process.env.STRIPE_TEST_CLIENT_KEY;
    const hasProdSecret = !!process.env.STRIPE_SECRET_KEY;
    const hasProdPublic = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const useTestFlag = process.env.STRIPE_USE_TEST;
    
    return NextResponse.json({
      environment,
      isTest,
      useTestFlag,
      envVars: {
        hasTestSecret,
        hasTestClient,
        hasProdSecret,
        hasProdPublic,
      },
      // デバッグ用：キーのプレフィックスのみ表示
      keyPrefixes: {
        testSecret: process.env.STRIPE_TEST_SECRET_KEY?.substring(0, 15) + '...',
        prodSecret: process.env.STRIPE_SECRET_KEY?.substring(0, 15) + '...',
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}