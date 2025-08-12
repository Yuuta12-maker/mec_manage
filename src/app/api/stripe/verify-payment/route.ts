import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, getCurrentEnvironment } from '@/lib/stripe-test';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const environment = getCurrentEnvironment();
    
    console.log(`🔧 Verifying payment in ${environment} environment`);
    
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { success: false, error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Stripeからセッション情報を取得
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // セッションのメタデータから決済タイプとIDを取得
    const paymentType = session.metadata?.type;
    const clientId = session.metadata?.client_id;
    const applicationId = session.metadata?.continuation_application_id;

    let verificationResult: any = { success: false, type: paymentType };

    // トライアル決済の確認
    if (paymentType === 'trial' && clientId) {
      // テスト環境では Stripe セッション状態のみで判定
      verificationResult = {
        success: session.payment_status === 'paid',
        type: 'trial',
        clientId,
        paymentStatus: session.payment_status === 'paid' ? 'succeeded' : 'pending',
        clientStatus: 'trial_paid'
      };
    }
    // 継続決済の確認
    else if (applicationId) {
      // テスト環境では Stripe セッション状態のみで判定
      verificationResult = {
        success: session.payment_status === 'paid',
        type: 'continuation',
        applicationId,
        paymentStatus: session.payment_status === 'paid' ? 'succeeded' : 'pending',
        applicationStatus: 'approved'
      };
    }
    else {
      return NextResponse.json(
        { success: false, error: 'Invalid session metadata' },
        { status: 400 }
      );
    }

    return NextResponse.json(verificationResult);

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}