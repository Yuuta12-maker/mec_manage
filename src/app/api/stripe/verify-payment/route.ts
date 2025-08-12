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
      const paymentSucceeded = session.payment_status === 'paid';
      
      verificationResult = {
        success: paymentSucceeded,
        type: 'trial',
        clientId,
        paymentStatus: paymentSucceeded ? 'succeeded' : 'pending',
        clientStatus: 'trial_paid'
      };

      // 決済成功時にメール送信（Webhookが機能しない場合の代替策）
      if (paymentSucceeded && session.customer_details?.email) {
        try {
          const { sendTrialPaymentCompletionEmailsWithGmail } = await import('@/lib/gmail');
          
          // クライアント情報を取得
          const { data: client, error } = await supabaseAdmin
            .from('clients')
            .select('name, email')
            .eq('id', clientId)
            .single();
          
          if (!error && client) {
            console.log('Sending trial payment completion email from verify-payment API');
            await sendTrialPaymentCompletionEmailsWithGmail(
              client.email,
              client.name,
              clientId,
              session.amount_total || 6000
            );
          }
        } catch (emailError) {
          console.error('Error sending payment completion email:', emailError);
          // メール送信失敗でも決済確認は成功として返す
        }
      }
    }
    // 継続決済の確認
    else if (applicationId) {
      const paymentSucceeded = session.payment_status === 'paid';
      
      verificationResult = {
        success: paymentSucceeded,
        type: 'continuation',
        applicationId,
        paymentStatus: paymentSucceeded ? 'succeeded' : 'pending',
        applicationStatus: 'approved'
      };

      // 決済成功時にメール送信（Webhookが機能しない場合の代替策）
      if (paymentSucceeded && session.customer_details?.email) {
        try {
          const { sendApplicationEmailsWithGmail } = await import('@/lib/gmail');
          
          // 継続申し込み情報を取得
          const { data: application, error } = await supabaseAdmin
            .from('continuation_applications')
            .select(`
              clients (
                name,
                email
              )
            `)
            .eq('id', applicationId)
            .single();
          
          if (!error && application?.clients && !Array.isArray(application.clients)) {
            const client = application.clients as { name: string; email: string };
            console.log('Sending continuation payment completion email from verify-payment API');
            await sendApplicationEmailsWithGmail(
              client.email,
              client.name,
              applicationId
            );
          }
        } catch (emailError) {
          console.error('Error sending continuation payment completion email:', emailError);
          // メール送信失敗でも決済確認は成功として返す
        }
      }
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