import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientName, sessionType, sessionDate, clientId, clientEmail } = body

    console.log('=== API Route: Preview Next Session Email ===')
    console.log('Request body:', body)

    if (!clientName || !sessionType || !sessionDate || !clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // セッション数を取得するためのダミー関数（プレビュー用）
    const getSessionCountForPreview = async (clientId: string) => {
      const { supabaseAdmin } = await import('@/lib/supabase-admin')
      const { data, error } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: true })
      
      if (error) return 0
      return data?.length || 0
    }

    const completedSessionCount = await getSessionCountForPreview(clientId)
    const bookingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/booking`
    
    // セッション回数とタイプに応じてメール内容を生成
    let subject: string
    let content: string
    
    if (sessionType === 'trial') {
      // トライアルセッション：継続のお誘い
      subject = '【MEC】継続プログラムのご案内'
      content = `${clientName} 様

本日はトライアルセッションにご参加いただき、ありがとうございました。

【継続プログラムについて】
• 6回のセッション（6ヶ月間・月1回）
• 料金: ¥214,000（税込）

継続プログラムにご興味をお持ちいただけましたら、下記からお申し込みください。

🔗 継続プログラム申し込みフォーム
${process.env.NEXT_PUBLIC_BASE_URL}/apply/continue?email=${encodeURIComponent(clientEmail || 'client@example.com')}

ご質問がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'}
━━━━━━━━━━━━━━━━━━━━━━━━━━`
      
    } else if (completedSessionCount >= 6) {
      // 6回目（最終）：お礼のメッセージ
      subject = '【MEC】プログラム完了のお知らせ'
      content = `${clientName} 様

6回のマインドエンジニアリング・コーチングプログラムが完了いたしました。
最後まで取り組んでいただき、ありがとうございました。

今後もサポートが必要な場合は、お気軽にご連絡ください。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'}
━━━━━━━━━━━━━━━━━━━━━━━━━━`
      
    } else {
      // 2-5回目：次回セッションの予約
      const remainingSessions = 6 - completedSessionCount
      subject = '【MEC】次回セッションのご予約について'
      content = `${clientName} 様

本日はセッションにご参加いただき、ありがとうございました。

【次回セッションのご予約】
下記のリンクからご都合の良い日時をお選びください。

🔗 セッション予約フォーム
${bookingUrl}

※月1回のペースでのご予約をおすすめしています

ご質問がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'}
━━━━━━━━━━━━━━━━━━━━━━━━━━`
    }

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