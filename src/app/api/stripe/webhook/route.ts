import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, getCurrentEnvironment, getWebhookSecret } from '@/lib/stripe-test';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// Webhook署名検証とイベント処理
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Webhook request received');
    
    const stripe = getStripeClient();
    const environment = getCurrentEnvironment();
    
    console.log(`🔧 Processing webhook in ${environment} environment`);
    console.log('📋 Environment variables check:', {
      hasStripeKey: !!process.env.STRIPE_TEST_SECRET_KEY || !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!getWebhookSecret(),
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
      console.error('❌ Webhook secret not configured for current environment:', environment);
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    console.log('✅ Webhook secret found for environment:', environment);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // イベントタイプに応じて処理を分岐
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'invoice.payment_succeeded':
          // 将来の定期課金対応時に使用
          console.log('Invoice payment succeeded:', event.data.object.id);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (processingError) {
      console.error('❌ Error processing webhook event:', processingError);
      console.error('Event type:', event?.type);
      console.error('Event data:', JSON.stringify(event?.data, null, 2));
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}

// Checkout Session完了時の処理
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id);

  const applicationId = session.metadata?.continuation_application_id;
  const clientId = session.metadata?.client_id;
  const paymentType = session.metadata?.type; // 'trial' or 'continuation'

  // トライアル決済の場合
  if (paymentType === 'trial' && clientId) {
    await handleTrialPaymentCompleted(session, clientId);
    return;
  }

  // 継続申し込み決済の場合
  if (!applicationId) {
    console.error('No continuation_application_id in session metadata');
    return;
  }

  try {
    // 継続申し込みのステータスを更新
    const { error: updateError } = await supabaseAdmin
      .from('continuation_applications')
      .update({
        status: 'approved',
        payment_status: 'succeeded',
        stripe_payment_intent_id: session.payment_intent as string,
        payment_amount: session.amount_total,
        payment_currency: session.currency?.toUpperCase(),
        paid_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating continuation application:', updateError);
      throw updateError;
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
        console.error('Error updating client status to active:', clientUpdateError);
      }
    }

    // 決済履歴をpaymentsテーブルに記録
    if (application) {
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          client_id: application.client_id,
          type: 'program',
          amount: Math.round((session.amount_total || 0) / 100), // centからyenに変換
          due_date: new Date().toISOString().split('T')[0], // 今日の日付
          status: 'completed',
          paid_date: new Date().toISOString().split('T')[0],
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      } else {
        console.log('Payment record created successfully');
      }
    }

    // 継続申込決済完了メールの送信はverify-payment APIで行うため、ここでは送信しない
    console.log('Continuation application payment completed. Email will be sent via verify-payment API.');

    console.log(`Successfully processed checkout session: ${session.id}`);
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    throw error;
  }
}

// Payment Intent成功時の処理
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  const applicationId = paymentIntent.metadata?.continuation_application_id;

  if (!applicationId) {
    console.log('No continuation_application_id in payment intent metadata');
    return;
  }

  try {
    // 決済履歴のステータスを更新 (payment_intent_idでの検索は困難なのでログのみ)
    console.log('Payment intent succeeded - payment record should already be created by checkout.session.completed');
  } catch (error) {
    console.error('Error in handlePaymentIntentSucceeded:', error);
  }
}

// Payment Intent失敗時の処理
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);

  const applicationId = paymentIntent.metadata?.continuation_application_id;

  if (!applicationId) {
    console.log('No continuation_application_id in payment intent metadata');
    return;
  }

  try {
    // 継続申し込みのステータスを更新
    const { error: updateError } = await supabaseAdmin
      .from('continuation_applications')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating continuation application:', updateError);
    }

    // 決済失敗のログ記録 (payment_intent_idでの検索は困難なのでログのみ)
    console.log('Payment failed:', paymentIntent.id, 'Error:', paymentIntent.last_payment_error?.message);
  } catch (error) {
    console.error('Error in handlePaymentIntentFailed:', error);
  }
}

// トライアル決済完了時の処理
async function handleTrialPaymentCompleted(session: Stripe.Checkout.Session, clientId: string) {
  console.log('Processing trial payment completed:', session.id, 'for client:', clientId);

  try {
    // クライアントのステータスを更新
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        trial_payment_status: 'succeeded',
        trial_paid_at: new Date().toISOString(),
        status: 'trial_booked', // トライアル予約可能状態に変更
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error updating client trial payment:', updateError);
      throw updateError;
    }

    // トライアル決済履歴をpaymentsテーブルに記録
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        client_id: clientId,
        type: 'trial',
        amount: Math.round((session.amount_total || 6000) / 100), // centからyenに変換
        due_date: new Date().toISOString().split('T')[0], // 今日の日付
        status: 'completed',
        paid_date: new Date().toISOString().split('T')[0],
      });

    if (paymentError) {
      console.error('Error creating trial payment record:', paymentError);
    } else {
      console.log('Trial payment record created successfully');
    }

    // トライアル決済完了メールの送信はverify-payment APIで行うため、ここでは送信しない
    console.log('Trial payment completed. Email will be sent via verify-payment API.');

    console.log(`Successfully processed trial payment: ${session.id}`);
  } catch (error) {
    console.error('Error in handleTrialPaymentCompleted:', error);
    throw error;
  }
}

// Webhookでのメール送信関数は削除済み
// メール送信はverify-payment APIで実行される