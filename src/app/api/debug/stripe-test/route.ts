import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, getCurrentEnvironment } from '@/lib/stripe-test';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 Starting Stripe connectivity test');
    
    // Environment check
    const environment = getCurrentEnvironment();
    console.log(`📊 Current environment: ${environment}`);
    console.log('🔐 Environment variables:', {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripeTestKey: !!process.env.STRIPE_TEST_SECRET_KEY,
      stripeUseTest: process.env.STRIPE_USE_TEST,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    });
    
    // Get Stripe client
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: 'Stripe client could not be initialized',
        environment,
      });
    }
    
    console.log('✅ Stripe client initialized successfully');
    
    // Test basic API connectivity
    console.log('🌐 Testing Stripe API connectivity...');
    
    // Simple API test - get account info
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe API connection successful');
    console.log('📋 Account info:', {
      id: account.id,
      country: account.country,
      default_currency: account.default_currency,
      charges_enabled: account.charges_enabled,
    });
    
    // Test customer creation (minimal)
    console.log('👤 Testing customer creation...');
    const testCustomer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: { test: 'true' }
    });
    console.log('✅ Test customer created:', testCustomer.id);
    
    // Clean up test customer
    await stripe.customers.del(testCustomer.id);
    console.log('🗑️ Test customer deleted');
    
    return NextResponse.json({
      success: true,
      environment,
      account: {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        charges_enabled: account.charges_enabled,
      },
      message: 'Stripe connectivity test passed'
    });
    
  } catch (error: unknown) {
    console.error('❌ Stripe connectivity test failed:', error);
    
    let errorDetails: any = {
      message: 'Unknown error',
      type: 'unknown',
    };
    
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }
    
    // Additional Stripe error handling
    if (error && typeof error === 'object') {
      const stripeError = error as any;
      if (stripeError.type) {
        errorDetails.stripeType = stripeError.type;
      }
      if (stripeError.code) {
        errorDetails.stripeCode = stripeError.code;
      }
      if (stripeError.decline_code) {
        errorDetails.stripeDeclineCode = stripeError.decline_code;
      }
      if (stripeError.param) {
        errorDetails.stripeParam = stripeError.param;
      }
    }
    
    return NextResponse.json({
      success: false,
      environment: getCurrentEnvironment(),
      error: errorDetails,
    });
  }
}