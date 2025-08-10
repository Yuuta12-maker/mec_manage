import { NextRequest, NextResponse } from 'next/server'
import { createSessionMeetEvent } from '@/lib/google-meet'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionDate, sessionType, clientName, clientEmail, sessionId } = body

    console.log('=== API Route: Create Meet Link ===')
    console.log('Request body:', body)
    console.log('Environment variables check:')
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing')
    console.log('GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? 'Set' : 'Missing')

    if (!sessionDate || !sessionType || !clientName || !clientEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Google Calendar API の認証情報チェック
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.warn('Google Calendar API credentials not configured. Skipping Meet link generation.')
      return NextResponse.json({
        success: false,
        error: 'Google Calendar API not configured',
        skipMeet: true,
      })
    }

    const result = await createSessionMeetEvent(
      sessionDate,
      sessionType,
      clientName,
      clientEmail
    )

    console.log('Meet link generation result:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}