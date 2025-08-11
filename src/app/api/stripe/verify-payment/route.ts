import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
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
      const { data: client, error } = await supabase
        .from('clients')
        .select('trial_payment_status, status')
        .eq('id', clientId)
        .single();

      if (error) {
        console.error('Error fetching client:', error);
        return NextResponse.json(
          { success: false, error: 'Client verification failed' },
          { status: 500 }
        );
      }

      verificationResult = {
        success: client.trial_payment_status === 'succeeded' && session.payment_status === 'paid',
        type: 'trial',
        clientId,
        paymentStatus: client.trial_payment_status,
        clientStatus: client.status
      };
    }
    // 継続決済の確認
    else if (applicationId) {
      const { data: application, error } = await supabase
        .from('continuation_applications')
        .select('payment_status, status')
        .eq('id', applicationId)
        .single();

      if (error) {
        console.error('Error fetching application:', error);
        return NextResponse.json(
          { success: false, error: 'Application verification failed' },
          { status: 500 }
        );
      }

      verificationResult = {
        success: application.payment_status === 'succeeded' && session.payment_status === 'paid',
        type: 'continuation',
        applicationId,
        paymentStatus: application.payment_status,
        applicationStatus: application.status
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