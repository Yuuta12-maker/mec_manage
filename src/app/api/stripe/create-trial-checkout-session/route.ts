import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_TRIAL_PRICE } from '@/lib/stripe';
import { getCurrentEnvironment } from '@/lib/stripe-test';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CreateTrialCheckoutSessionRequest, CreateTrialCheckoutSessionResponse } from '@/types';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateTrialCheckoutSessionResponse | { error: string }>> {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
    'Content-Type': 'application/json',
  };
  
  try {
    // Request validation
    const contentType = request.headers.get('content-type')
    console.log('📨 Request headers:', {
      contentType,
      accept: request.headers.get('accept'),
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
    })
    
    if (!contentType?.includes('application/json')) {
      console.error('❌ Invalid Content-Type:', contentType)
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 406, headers: corsHeaders }
      )
    }
    const environment = getCurrentEnvironment();
    
    console.log(`🔧 Creating trial checkout session in ${environment} environment`);
    console.log('🌍 Environment variables check:', {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripeTestKey: !!process.env.STRIPE_TEST_SECRET_KEY,
      useTestEnv: process.env.STRIPE_USE_TEST,
      nodeEnv: process.env.NODE_ENV,
      environment
    });

    // Parse request body with error handling
    let body: CreateTrialCheckoutSessionRequest;
    try {
      const rawBody = await request.text();
      console.log('📥 Raw request body:', rawBody);
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { clientId } = body;
    console.log('🔍 Processing request for client:', clientId);

    // バリデーション
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400, headers: corsHeaders }
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
        { status: 404, headers: corsHeaders }
      );
    }

    // 既に決済済みでないかチェック
    if (client.trial_payment_status === 'succeeded') {
      return NextResponse.json(
        { error: 'Trial payment already completed' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Stripe API key
    const stripeSecretKey = environment === 'test' 
      ? process.env.STRIPE_TEST_SECRET_KEY
      : process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('❌ No Stripe secret key found for environment:', environment);
      return NextResponse.json(
        { error: `No Stripe key configured for ${environment} environment` },
        { status: 500, headers: corsHeaders }
      );
    }

    // Stripe顧客を作成または取得 (直接API呼び出し)
    let stripeCustomerId: string;
    if (client.stripe_customer_id) {
      stripeCustomerId = client.stripe_customer_id;
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
          'email': client.email,
          'name': client.name,
          'metadata[client_id]': clientId,
          'metadata[type]': 'trial',
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

      // stripe_customer_idをクライアントテーブルに保存
      await supabaseAdmin
        .from('clients')
        .update({
          stripe_customer_id: customer.id,
        })
        .eq('id', clientId);
    }

    // Checkout Session作成 (直接API呼び出し)
    console.log('💳 Creating Stripe checkout session with params:', {
      customer: stripeCustomerId,
      amount: DEFAULT_TRIAL_PRICE,
      clientId,
      email: client.email,
      environment
    });
    
    const sessionParams = new URLSearchParams({
      'customer': stripeCustomerId,
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'jpy',
      'line_items[0][price_data][product_data][name]': 'MECトライアルセッション',
      'line_items[0][price_data][product_data][description]': 'マインドエンジニアリング・コーチング トライアルセッション（30分）',
      'line_items[0][price_data][unit_amount]': DEFAULT_TRIAL_PRICE.toString(),
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'success_url': `${process.env.NEXT_PUBLIC_APP_URL || 'https://mec-manage.vercel.app'}/apply/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${process.env.NEXT_PUBLIC_APP_URL || 'https://mec-manage.vercel.app'}/apply/cancel?client_id=${clientId}`,
      'metadata[client_id]': clientId,
      'metadata[type]': 'trial',
      'metadata[client_email]': client.email,
      'customer_update[address]': 'auto',
      'payment_intent_data[metadata][client_id]': clientId,
      'payment_intent_data[metadata][type]': 'trial',
    });
    
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
    }, { headers: corsHeaders });

  } catch (error: unknown) {
    console.error('❌ Error creating trial checkout session:', error);
    
    // 環境情報の詳細ログ
    console.error('🌍 Runtime environment:', {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      stripeUseTest: process.env.STRIPE_USE_TEST,
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasStripeTest: !!process.env.STRIPE_TEST_SECRET_KEY,
      userAgent: process.env.VERCEL ? 'Vercel' : 'Local',
    });
    
    // エラーの型チェックと詳細ログ
    if (error instanceof Error) {
      console.error('💥 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500) + '...' // Truncate for readability
      });
    }
    
    console.error('🔍 Error type:', typeof error);
    
    // Stripeエラーの詳細情報を取得
    if (error && typeof error === 'object') {
      const stripeError = error as any;
      console.error('🔴 Stripe error details:', {
        type: stripeError.type,
        code: stripeError.code,
        decline_code: stripeError.decline_code,
        param: stripeError.param,
        request_id: stripeError.request_id,
        charge: stripeError.charge,
        payment_method: stripeError.payment_method,
      });
    }
    
    // Network specific error handling
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNRESET')) {
        console.error('🌐 Network connectivity issue detected');
        return NextResponse.json(
          { error: 'Network connectivity issue with Stripe. Please try again.' },
          { status: 503, headers: corsHeaders }
        );
      }
      
      if (error.message.includes('timeout')) {
        console.error('⏱️ Timeout issue detected');
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 408, headers: corsHeaders }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to create trial checkout session: ${error.message}` },
        { status: 500, headers: corsHeaders }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create trial checkout session' },
      { status: 500, headers: corsHeaders }
    );
  }
}