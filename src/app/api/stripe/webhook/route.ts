import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, getCurrentEnvironment, getWebhookSecret } from '@/lib/stripe-test';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// Webhook署名検証とイベント処理
export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient();
    const environment = getCurrentEnvironment();
    
    console.log(`🔧 Processing webhook in ${environment} environment`);
    
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
      console.error('Webhook secret not configured for current environment');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

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
      console.error('Error processing webhook event:', processingError);
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

    // 決済トランザクションを記録
    const { error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        continuation_application_id: applicationId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total || 0,
        currency: session.currency?.toUpperCase() || 'JPY',
        status: 'succeeded',
        payment_method_type: 'card',
      });

    if (transactionError) {
      console.error('Error creating payment transaction:', transactionError);
      // 継続申し込みは既に更新済みなので、ログのみ
    }

    // 決済完了メールの送信（非同期）
    if (session.customer_details?.email) {
      sendPaymentConfirmationEmail(
        session.customer_details.email,
        applicationId,
        session.amount_total || 0
      ).catch(emailError => {
        console.error('Error sending payment confirmation email:', emailError);
      });
    }

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
    // 決済トランザクションのステータスを更新
    const { error } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'succeeded',
        stripe_charge_id: paymentIntent.latest_charge as string,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating payment transaction:', error);
    }
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

    // 決済トランザクションのステータスを更新
    const { error: transactionError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        status: 'failed',
        failure_code: paymentIntent.last_payment_error?.code,
        failure_message: paymentIntent.last_payment_error?.message,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (transactionError) {
      console.error('Error updating payment transaction:', transactionError);
    }
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

    // トライアル決済トランザクションを記録
    const { error: transactionError } = await supabaseAdmin
      .from('trial_payment_transactions')
      .insert({
        client_id: clientId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount: session.amount_total || 6000,
        currency: session.currency?.toUpperCase() || 'JPY',
        status: 'succeeded',
        payment_method_type: 'card',
      });

    if (transactionError) {
      console.error('Error creating trial payment transaction:', transactionError);
      // クライアント更新は完了しているので、ログのみ
    }

    // トライアル決済完了メールの送信（非同期）
    if (session.customer_details?.email) {
      sendTrialPaymentConfirmationEmail(
        session.customer_details.email,
        clientId,
        session.amount_total || 6000
      ).catch(emailError => {
        console.error('Error sending trial payment confirmation email:', emailError);
      });
    }

    console.log(`Successfully processed trial payment: ${session.id}`);
  } catch (error) {
    console.error('Error in handleTrialPaymentCompleted:', error);
    throw error;
  }
}

// 決済完了メール送信（Gmail実装）
async function sendPaymentConfirmationEmail(
  email: string,
  applicationId: string,
  amount: number
) {
  try {
    console.log(`Sending payment confirmation email to: ${email}`);
    console.log(`Application ID: ${applicationId}, Amount: ${amount}`);
    
    // Gmail送信機能を使用
    const { sendApplicationEmailsWithGmail } = await import('@/lib/gmail');
    
    // 申し込み者情報を取得
    const { data: application } = await supabaseAdmin
      .from('continuation_applications')
      .select(`
        clients (
          id,
          name,
          email
        )
      `)
      .eq('id', applicationId)
      .single();
    
    if (application?.clients && !Array.isArray(application.clients)) {
      const client = application.clients as { id: string; name: string; email: string };
      await sendApplicationEmailsWithGmail(
        client.email,
        client.name,
        client.id
      );
    }
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
}

// トライアル決済完了メール送信
async function sendTrialPaymentConfirmationEmail(
  email: string,
  clientId: string,
  amount: number
) {
  try {
    console.log(`Sending trial payment confirmation email to: ${email}`);
    console.log(`Client ID: ${clientId}, Amount: ${amount}`);
    
    // Gmail送信機能を使用
    const { sendApplicationEmailsWithGmail } = await import('@/lib/gmail');
    
    // クライアント情報を取得
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, name, email')
      .eq('id', clientId)
      .single();
    
    if (client) {
      await sendApplicationEmailsWithGmail(
        client.email,
        client.name,
        client.id
      );
    }
  } catch (error) {
    console.error('Error sending trial payment confirmation email:', error);
    throw error;
  }
}