import { NextResponse } from 'next/server'
import { testGoogleCalendarConnection } from '@/lib/google-meet'

export async function GET() {
  try {
    const result = await testGoogleCalendarConnection()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}