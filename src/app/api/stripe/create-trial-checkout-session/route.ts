import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_TRIAL_PRICE } from '@/lib/stripe';
import { getStripeClient, getCurrentEnvironment } from '@/lib/stripe-test';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CreateTrialCheckoutSessionRequest, CreateTrialCheckoutSessionResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<CreateTrialCheckoutSessionResponse | { error: string }>> {
  try {
    const stripe = getStripeClient();
    const environment = getCurrentEnvironment();
    
    console.log(`🔧 Creating trial checkout session in ${environment} environment`);
    
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const body: CreateTrialCheckoutSessionRequest = await request.json();
    const { clientId } = body;

    // バリデーション
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // クライアント情報を取得
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientError);
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // 既に決済済みでないかチェック
    if (client.trial_payment_status === 'succeeded') {
      return NextResponse.json(
        { error: 'Trial payment already completed' },
        { status: 400 }
      );
    }

    // Stripe顧客を作成または取得
    let stripeCustomerId: string;
    if (client.stripe_customer_id) {
      stripeCustomerId = client.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: client.email,
        name: client.name,
        metadata: {
          client_id: clientId,
          type: 'trial',
        },
      });
      stripeCustomerId = customer.id;

      // stripe_customer_idをクライアントテーブルに保存
      await supabaseAdmin
        .from('clients')
        .update({
          stripe_customer_id: customer.id,
        })
        .eq('id', clientId);
    }

    // Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: {
            name: 'MECトライアルセッション',
            description: 'マインドエンジニアリング・コーチング トライアルセッション（30分）',
          },
          unit_amount: DEFAULT_TRIAL_PRICE,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mec-manage.vercel.app'}/apply/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mec-manage.vercel.app'}/apply/cancel?client_id=${clientId}`,
      metadata: {
        client_id: clientId,
        type: 'trial',
        client_email: client.email,
      },
      customer_update: {
        address: 'auto',
      },
      payment_intent_data: {
        metadata: {
          client_id: clientId,
          type: 'trial',
        },
      },
    });

    // セッションIDをデータベースに保存
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({
        trial_stripe_session_id: session.id,
        trial_payment_status: 'processing',
        trial_payment_amount: DEFAULT_TRIAL_PRICE,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error updating client:', updateError);
      // セッションは作成済みなので、エラーでもレスポンスは返す
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url || '',
    });

  } catch (error) {
    console.error('Error creating trial checkout session:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create trial checkout session: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create trial checkout session' },
      { status: 500 }
    );
  }
}