import { NextRequest, NextResponse } from 'next/server'
import { sendSmartEmail } from '@/lib/smart-email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientEmail, clientName, sessionDate, sessionType, meetLink, sessionId } = body

    console.log('=== API Route: Smart Email System ===')
    console.log('Request body:', body)

    if (!clientEmail || !clientName || !sessionDate || !sessionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // クライアント向けメール
    const clientSubject = 'セッション予約が完了しました'
    const clientContent = `${clientName} 様

セッションのご予約が完了いたしました。

* セッション種別: ${sessionType === 'trial' ? 'トライアル' : '通常セッション'}
* 予定日時: ${new Date(sessionDate).toLocaleString('ja-JP')}
${meetLink ? `* Google Meet URL: ${meetLink}` : ''}

当日お会いできることを楽しみにしております。

MEC管理システム`

    // 管理者向けメール
    const adminEmail = 'mindengineeringcoaching@gmail.com'
    const adminSubject = '新規セッション予約がありました'
    const adminContent = `新規セッション予約がありました。

* お名前: ${clientName}
* メールアドレス: ${clientEmail}
* セッション種別: ${sessionType === 'trial' ? 'トライアル' : '通常セッション'}
* 予定日時: ${new Date(sessionDate).toLocaleString('ja-JP')}
${sessionId ? `* セッションID: ${sessionId}` : ''}

管理画面から詳細を確認してください。`

    // スマートメール送信
    const clientResult = await sendSmartEmail({
      to: clientEmail,
      subject: clientSubject,
      content: clientContent,
      type: 'booking',
      related_id: sessionId,
    })

    await new Promise(resolve => setTimeout(resolve, 2000))

    const adminResult = await sendSmartEmail({
      to: adminEmail,
      subject: adminSubject,
      content: adminContent,
      type: 'booking',
      related_id: sessionId,
    })

    console.log('Smart email results:', { clientResult, adminResult })

    return NextResponse.json({
      clientResult,
      adminResult,
      success: clientResult.success && adminResult.success
    })
  } catch (error) {
    console.error('Smart email API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}