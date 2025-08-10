import { NextRequest, NextResponse } from 'next/server'
import { testGoogleCalendarConnection } from '@/lib/google-meet'

export async function GET(request: NextRequest) {
  try {
    console.log('=== API Route: Test Google Calendar ===')
    console.log('Environment variables check:')
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing')
    console.log('GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? 'Set' : 'Missing')

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      return NextResponse.json({
        success: false,
        configured: false,
        error: 'Google Calendar API credentials are not configured. Please check your environment variables.',
        instructions: [
          '1. Set up a Google Cloud Project and enable the Calendar API',
          '2. Create OAuth 2.0 credentials',
          '3. Add the following environment variables to your .env.local file:',
          '   - GOOGLE_CLIENT_ID',
          '   - GOOGLE_CLIENT_SECRET', 
          '   - GOOGLE_REFRESH_TOKEN',
          '4. To get a refresh token, follow the OAuth flow or use tools like Google OAuth 2.0 Playground'
        ]
      })
    }

    const result = await testGoogleCalendarConnection()

    return NextResponse.json({
      ...result,
      configured: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({
      success: false,
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}