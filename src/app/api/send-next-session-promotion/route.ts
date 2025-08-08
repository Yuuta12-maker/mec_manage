import { NextRequest, NextResponse } from 'next/server'
import { sendNextSessionPromotionEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientEmail, clientName, sessionId, sessionType, sessionDate } = body

    console.log('=== API Route: Send Next Session Promotion Email ===')
    console.log('Request body:', body)

    if (!clientEmail || !clientName || !sessionId || !sessionType || !sessionDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendNextSessionPromotionEmail(
      clientEmail,
      clientName,
      sessionId,
      sessionType,
      sessionDate
    )

    console.log('Next session promotion email result:', result)

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