import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 Testing direct Stripe API call without SDK');
    
    // Environment check
    const stripeSecretKey = process.env.STRIPE_TEST_SECRET_KEY;
    const useTest = process.env.STRIPE_USE_TEST === 'true';
    
    console.log('📊 Environment:', {
      useTest,
      hasTestKey: !!stripeSecretKey,
      keyPrefix: stripeSecretKey?.slice(0, 8),
    });
    
    if (!stripeSecretKey) {
      return NextResponse.json({
        success: false,
        error: 'No Stripe test key available'
      });
    }
    
    // Direct API call to Stripe
    console.log('🌐 Making direct HTTP call to Stripe API...');
    
    const response = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2025-07-30.basil',
        'User-Agent': 'Vercel-Debug/1.0',
      },
      body: new URLSearchParams({
        'email': 'test@example.com',
        'name': 'Test Customer',
        'metadata[test]': 'true',
        'metadata[source]': 'debug-api'
      }),
    });
    
    console.log('📡 Stripe API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Stripe API Error:', errorText);
      
      return NextResponse.json({
        success: false,
        error: `Stripe API HTTP ${response.status}: ${errorText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        }
      });
    }
    
    const customerData = await response.json();
    console.log('✅ Customer created successfully:', customerData.id);
    
    // Clean up - delete the test customer
    const deleteResponse = await fetch(`https://api.stripe.com/v1/customers/${customerData.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Stripe-Version': '2025-07-30.basil',
      },
    });
    
    console.log('🗑️ Customer cleanup:', deleteResponse.ok ? 'success' : 'failed');
    
    return NextResponse.json({
      success: true,
      message: 'Direct Stripe API call successful',
      customer_id: customerData.id,
      test_completed_at: new Date().toISOString(),
      api_version: '2025-07-30.basil'
    });
    
  } catch (error: unknown) {
    console.error('💥 Direct API call failed:', error);
    
    let errorDetails: any = {
      message: 'Unknown error',
      type: 'unknown',
    };
    
    if (error instanceof Error) {
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5), // First 5 lines only
      };
    }
    
    // Check for network-specific errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorDetails.networkError = true;
      errorDetails.suggestion = 'Network connectivity issue - check if Vercel can reach api.stripe.com';
    }
    
    return NextResponse.json({
      success: false,
      error: 'Direct API call failed',
      details: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
}