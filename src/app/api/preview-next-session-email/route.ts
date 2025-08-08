import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, sessionType, sessionDate } = body

    console.log('=== API Route: Preview Next Session Email ===')
    console.log('Request body:', body)

    if (!clientName || !sessionType || !sessionDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const bookingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/booking`
    
    const subject = '【MEC】セッションお疲れ様でした - 次回のご予約はいかがですか？'
    const content = `${clientName} 様

本日は${sessionType === 'trial' ? 'トライアル' : ''}セッションにご参加いただき、誠にありがとうございました。

【実施セッション】
・日時: ${new Date(sessionDate).toLocaleString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit'
})}
・種別: ${sessionType === 'trial' ? 'トライアルセッション' : '通常セッション'}

${sessionType === 'trial' ? 
`今回のトライアルセッションはいかがでしたでしょうか？
マインドエンジニアリング・コーチングを通して、新しい気づきや発見がありましたら嬉しく思います。

【継続セッションのご案内】
より深い成果を得るために、継続的なセッションをご検討いただければと思います。
継続セッションでは、より具体的な目標設定と実践的なアプローチで、
あなたの成長をサポートいたします。` :
`今回のセッションはいかがでしたでしょうか？
継続的なセッションで、さらなる成長と成果を実感していただけるよう、
次回のご予約をお待ちしております。`}

【次回予約について】
下記のリンクから、ご都合の良い日時をお選びいただけます。

🔗 セッション予約フォーム
${bookingUrl}

【よくあるご質問】
Q: いつ頃予約すれば良いでしょうか？
A: 学習効果を高めるため、2-4週間以内のご予約をおすすめしています。

Q: セッション内容に不安があります
A: お気軽にご相談ください。あなたのペースに合わせて進めますので、ご安心ください。

ご不明な点やご相談がございましたら、お気軽にお問い合わせください。
${clientName}さんの更なる成長を心よりサポートいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: mindengineeringcoaching@gmail.com
━━━━━━━━━━━━━━━━━━━━━━━━━━`

    return NextResponse.json({
      success: true,
      preview: {
        subject,
        content
      }
    })
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