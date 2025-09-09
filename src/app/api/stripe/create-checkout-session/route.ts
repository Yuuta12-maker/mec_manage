import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PROGRAM_PRICE } from '@/lib/stripe';
import { getCurrentEnvironment } from '@/lib/stripe-test';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CreateCheckoutSessionRequest, CreateCheckoutSessionResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<CreateCheckoutSessionResponse | { error: string }>> {
  try {
    const environment = getCurrentEnvironment();
    
    console.log(`🔧 Creating checkout session in ${environment} environment`);
    
    // Get Stripe API key
    const stripeSecretKey = environment === 'test' 
      ? process.env.STRIPE_TEST_SECRET_KEY
      : process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('❌ No Stripe secret key found for environment:', environment);
      return NextResponse.json(
        { error: `No Stripe key configured for ${environment} environment` },
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
      console.log('👤 Using existing customer:', stripeCustomerId);
    } else {
      console.log('👤 Creating new Stripe customer...');
      
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Stripe-Version': '2025-07-30.basil',
        },
        body: new URLSearchParams({
          'email': application.clients.email,
          'name': application.clients.name,
          'metadata[client_id]': application.client_id,
        }),
      });
      
      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        console.error('❌ Customer creation failed:', errorText);
        throw new Error(`Customer creation failed: ${errorText}`);
      }
      
      const customer = await customerResponse.json();
      stripeCustomerId = customer.id;
      console.log('✅ Customer created:', stripeCustomerId);

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

    // Checkout Session作成 (直接API呼び出し)
    console.log('💳 Creating Stripe checkout session with params:', {
      customer: stripeCustomerId,
      amount: DEFAULT_PROGRAM_PRICE,
      continuationApplicationId,
      environment
    });
    
    const sessionParams = new URLSearchParams({
      'customer': stripeCustomerId,
      'payment_method_types[]': 'card',
      'mode': 'payment',
      'success_url': `${process.env.NEXT_PUBLIC_APP_URL || 'https://mec-manage.vercel.app'}/apply/continue/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${process.env.NEXT_PUBLIC_APP_URL || 'https://mec-manage.vercel.app'}/apply/continue/cancel?application_id=${continuationApplicationId}`,
      'metadata[continuation_application_id]': continuationApplicationId,
      'metadata[client_id]': application.client_id,
      'metadata[client_email]': application.clients.email,
      'customer_update[address]': 'auto',
      'payment_intent_data[metadata][continuation_application_id]': continuationApplicationId,
      'payment_intent_data[metadata][client_id]': application.client_id,
    });
    
    // Use price ID or create price data
    if (priceId && process.env.STRIPE_PRICE_ID) {
      sessionParams.append('line_items[0][price]', process.env.STRIPE_PRICE_ID);
      sessionParams.append('line_items[0][quantity]', '1');
    } else {
      sessionParams.append('line_items[0][price_data][currency]', 'jpy');
      sessionParams.append('line_items[0][price_data][product_data][name]', 'MEC 6回継続プログラム');
      sessionParams.append('line_items[0][price_data][product_data][description]', 'マインドエンジニアリング・コーチング 6回セッション');
      sessionParams.append('line_items[0][price_data][unit_amount]', DEFAULT_PROGRAM_PRICE.toString());
      sessionParams.append('line_items[0][quantity]', '1');
    }
    
    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2025-07-30.basil',
      },
      body: sessionParams,
    });
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('❌ Checkout session creation failed:', errorText);
      throw new Error(`Checkout session creation failed: ${errorText}`);
    }
    
    const session = await sessionResponse.json();
    console.log('✅ Stripe session created successfully:', session.id);

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

  } catch (error: unknown) {
    console.error('❌ Error creating checkout session:', error);
    
    // エラーの詳細ログ
    if (error instanceof Error) {
      console.error('💥 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500) + '...'
      });
      
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