import { NextRequest, NextResponse } from 'next/server'
import { sendBookingEmails } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientEmail, clientName, sessionDate, sessionType, meetLink, sessionId } = body

    console.log('=== API Route: Send Booking Email (Resend) ===')
    console.log('Request body:', body)
    console.log('Environment variables check:')
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Missing')

    if (!clientEmail || !clientName || !sessionDate || !sessionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendBookingEmails(
      clientEmail,
      clientName,
      sessionDate,
      sessionType,
      meetLink,
      sessionId
    )

    console.log('Email sending result (Resend):', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('API Route error (Resend):', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}