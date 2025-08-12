import { NextRequest, NextResponse } from 'next/server';
import { stripe, DEFAULT_PROGRAM_PRICE } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CreateCheckoutSessionRequest, CreateCheckoutSessionResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<CreateCheckoutSessionResponse | { error: string }>> {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const body: CreateCheckoutSessionRequest = await request.json();
    const { continuationApplicationId, priceId } = body;

    // バリデーション
    if (!continuationApplicationId) {
      return NextResponse.json(
        { error: 'Continuation application ID is required' },
        { status: 400 }
      );
    }

    // 継続申し込み情報を取得
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('continuation_applications')
      .select(`
        *,
        clients (
          id,
          name,
          email
        )
      `)
      .eq('id', continuationApplicationId)
      .single();

    if (applicationError || !application) {
      console.error('Application not found:', applicationError);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // 既に決済済みでないかチェック
    if (application.payment_status === 'succeeded') {
      return NextResponse.json(
        { error: 'Payment already completed' },
        { status: 400 }
      );
    }

    // 金額設定（プライスIDがある場合はそれを使用、なければデフォルト価格）
    const lineItems = priceId && process.env.STRIPE_PRICE_ID
      ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
      : [{
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'MEC 6回継続プログラム',
              description: 'マインドエンジニアリング・コーチング 6回セッション',
            },
            unit_amount: DEFAULT_PROGRAM_PRICE,
          },
          quantity: 1,
        }];

    // Stripe顧客を作成または取得
    let stripeCustomerId: string;
    const { data: existingCustomer } = await supabaseAdmin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('client_id', application.client_id)
      .single();

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: application.clients.email,
        name: application.clients.name,
        metadata: {
          client_id: application.client_id,
        },
      });
      stripeCustomerId = customer.id;

      // stripe_customersテーブルに保存
      await supabaseAdmin
        .from('stripe_customers')
        .insert({
          client_id: application.client_id,
          stripe_customer_id: customer.id,
          email: application.clients.email,
          name: application.clients.name,
        });
    }

    // Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/apply/continue/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/apply/continue/cancel?application_id=${continuationApplicationId}`,
      metadata: {
        continuation_application_id: continuationApplicationId,
        client_id: application.client_id,
        client_email: application.clients.email,
      },
      customer_update: {
        address: 'auto',
      },
      payment_intent_data: {
        metadata: {
          continuation_application_id: continuationApplicationId,
          client_id: application.client_id,
        },
      },
    });

    // セッションIDをデータベースに保存
    const { error: updateError } = await supabaseAdmin
      .from('continuation_applications')
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: 'processing',
        stripe_customer_id: stripeCustomerId,
        payment_amount: DEFAULT_PROGRAM_PRICE,
        payment_currency: 'JPY',
        updated_at: new Date().toISOString(),
      })
      .eq('id', continuationApplicationId);

    if (updateError) {
      console.error('Error updating application:', updateError);
      // セッションは作成済みなので、エラーでもレスポンスは返す
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url || '',
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create checkout session: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}