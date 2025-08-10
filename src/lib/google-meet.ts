'use server'

import { google } from 'googleapis'

interface GoogleMeetEventData {
  summary: string
  description?: string
  start: Date
  end: Date
  attendeeEmail: string
  attendeeName: string
}

interface GoogleMeetResult {
  success: boolean
  meetLink?: string
  eventId?: string
  error?: string
}

// Google Calendar API の設定
function getCalendarClient() {
  const credentials = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  }

  if (!credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
    throw new Error('Missing Google Calendar API credentials')
  }

  const oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    'urn:ietf:wg:oauth:2.0:oob' // For server-side applications
  )

  oauth2Client.setCredentials({
    refresh_token: credentials.refresh_token,
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function createGoogleMeetEvent(eventData: GoogleMeetEventData): Promise<GoogleMeetResult> {
  try {
    console.log('=== Creating Google Meet Event ===')
    console.log('Event data:', eventData)
    
    const calendar = getCalendarClient()
    
    // イベントの詳細を設定
    console.log('=== Google Calendar Event Data ===')
    console.log('Event start time (ISO):', eventData.start.toISOString())
    console.log('Event end time (ISO):', eventData.end.toISOString())
    console.log('Event start time (JST):', eventData.start.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))
    console.log('Event end time (JST):', eventData.end.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))
    
    const event = {
      summary: eventData.summary,
      description: eventData.description || '',
      start: {
        dateTime: eventData.start.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: eventData.end.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      attendees: [
        {
          email: eventData.attendeeEmail,
          displayName: eventData.attendeeName,
        },
      ],
      // Google Meet の設定
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      // メール通知を無効化（独自のメール送信を使用）
      sendNotifications: false,
      sendUpdates: 'none',
    }

    console.log('Creating calendar event with Google Meet...')
    
    // イベントを作成（conferenceDataVersion=1 でGoogle Meetリンクを有効化）
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    })

    console.log('Calendar event created:', response.data)

    const createdEvent = response.data
    const meetLink = createdEvent.conferenceData?.entryPoints?.find(
      (entry: any) => entry.entryPointType === 'video'
    )?.uri

    if (!meetLink) {
      throw new Error('Failed to generate Google Meet link')
    }

    console.log('Google Meet link generated:', meetLink)
    
    return {
      success: true,
      meetLink,
      eventId: createdEvent.id || undefined,
    }
  } catch (error) {
    console.error('Error creating Google Meet event:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// セッション用のGoogle Meetイベントを作成する便利関数
export async function createSessionMeetEvent(
  sessionDate: string,
  sessionType: string,
  clientName: string,
  clientEmail: string
): Promise<GoogleMeetResult> {
  console.log('=== Session Date Processing ===')
  console.log('Original sessionDate:', sessionDate)
  
  // 日本時間として正しく解析
  // sessionDateは "YYYY-MM-DDTHH:mm:ss" 形式で日本時間として扱う
  let startDate: Date
  
  if (sessionDate.includes('T') && !sessionDate.includes('Z') && !sessionDate.includes('+')) {
    // ローカル時間として解析（日本時間）
    startDate = new Date(sessionDate)
  } else {
    // UTCとして解析された場合は、日本時間に調整
    startDate = new Date(sessionDate)
  }
  
  console.log('Parsed startDate:', startDate)
  console.log('StartDate ISO:', startDate.toISOString())
  console.log('StartDate JST:', startDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))
  
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1時間後
  console.log('EndDate JST:', endDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }))

  const summary = `${sessionType === 'trial' ? 'トライアル' : ''}セッション - ${clientName}様`
  const description = `マインドエンジニアリング・コーチングセッション

クライアント: ${clientName}様
セッション種別: ${sessionType === 'trial' ? 'トライアルセッション' : '通常セッション'}
コーチ: 森山雄太

【セッション前の準備】
・静かな環境でご参加ください
・カメラとマイクの動作確認をお願いします
・筆記用具をご準備ください

何かご質問がございましたら、お気軽にお問い合わせください。`

  return createGoogleMeetEvent({
    summary,
    description,
    start: startDate,
    end: endDate,
    attendeeEmail: clientEmail,
    attendeeName: clientName,
  })
}

// 設定された認証情報をテストする関数
export async function testGoogleCalendarConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('=== Testing Google Calendar Connection ===')
    
    const calendar = getCalendarClient()
    
    // カレンダーリストを取得してアクセスをテスト
    const response = await calendar.calendarList.list({
      maxResults: 1,
    })
    
    console.log('Google Calendar connection test successful')
    console.log('Available calendars:', response.data.items?.length || 0)
    
    return { success: true }
  } catch (error) {
    console.error('Google Calendar connection test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}