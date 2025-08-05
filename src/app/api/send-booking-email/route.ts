import { NextRequest, NextResponse } from 'next/server'
import { sendBookingEmailsWithGmail } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientEmail, clientName, sessionDate, sessionType, meetLink, sessionId } = body

    console.log('=== API Route: Send Booking Email ===')
    console.log('Request body:', body)

    if (!clientEmail || !clientName || !sessionDate || !sessionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendBookingEmailsWithGmail(
      clientEmail,
      clientName,
      sessionDate,
      sessionType,
      meetLink,
      sessionId
    )

    console.log('Email sending result:', result)

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