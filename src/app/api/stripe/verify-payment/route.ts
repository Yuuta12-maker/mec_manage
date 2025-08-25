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

      // 決済成功時にメール送信（申込・決済完了統合メール）
      if (paymentSucceeded) {
        try {
          const { sendTrialPaymentCompletionEmailsWithGmail } = await import('@/lib/gmail');
          
          // クライアント情報を取得
          const { data: client, error } = await supabaseAdmin
            .from('clients')
            .select('name, email')
            .eq('id', clientId)
            .single();
          
          if (!error && client) {
            console.log('Sending trial application and payment completion email from verify-payment API');
            await sendTrialPaymentCompletionEmailsWithGmail(
              client.email,
              client.name,
              clientId,
              session.amount_total || 6000
            );
          }
        } catch (emailError) {
          console.error('Error sending application and payment completion email:', emailError);
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

      // 決済成功時の処理
      if (paymentSucceeded) {
        try {
          // データベースを更新（決済成功、申し込み承認）
          const { error: updateError } = await supabaseAdmin
            .from('continuation_applications')
            .update({
              payment_status: 'succeeded',
              status: 'approved',
              paid_at: new Date().toISOString(),
              approved_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
              payment_method_type: session.payment_method_types?.[0] || 'card',
            })
            .eq('id', applicationId);

          if (updateError) {
            console.error('Error updating continuation application:', updateError);
          }

          // クライアントのステータスをactiveに更新
          const { data: application } = await supabaseAdmin
            .from('continuation_applications')
            .select('client_id')
            .eq('id', applicationId)
            .single();

          if (application) {
            const { error: clientUpdateError } = await supabaseAdmin
              .from('clients')
              .update({
                status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('id', application.client_id);

            if (clientUpdateError) {
              console.error('Error updating client status:', clientUpdateError);
            }
          }

          // 継続プログラム決済完了メールは送信しない（管理者が管理画面で確認）
          console.log('Continuation payment completed - no email notification sent');
        } catch (emailError) {
          console.error('Error in payment success processing:', emailError);
          // エラーでも決済確認は成功として返す
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