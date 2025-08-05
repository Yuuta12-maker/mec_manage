import { NextRequest, NextResponse } from 'next/server'
import { sendBookingEmailsWithGmail } from '@/lib/gmail'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientEmail, clientName, sessionDate, sessionType, meetLink, sessionId } = body

    console.log('=== API Route: Send Booking Email ===')
    console.log('Request body:', body)
    console.log('Environment variables check:')
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Missing')
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Missing')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('All env keys:', Object.keys(process.env).filter(key => key.includes('GMAIL')))

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