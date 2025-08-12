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
      subject = '【MEC】トライアルセッションお疲れ様でした - 継続プログラムのご案内'
      content = `${clientName} 様

本日はトライアルセッションにご参加いただき、誠にありがとうございました。

【実施セッション】
・日時: ${new Date(sessionDate).toLocaleString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit'
})}
・種別: トライアルセッション

今回のトライアルセッションはいかがでしたでしょうか？
マインドエンジニアリング・コーチングを通して、新しい気づきや発見がありましたら嬉しく思います。

【継続プログラムのご案内】
より深い成果と持続的な成長を実現するために、継続プログラムをご用意しております。

✨ 継続プログラムの特徴
• 6回のセッションで体系的にスキルを構築
• あなた専用のアクションプランを作成
• 定期的なフォローアップとサポート
• 実践的なツールとテクニックの習得

【次回セッションのご予約】
継続プログラムにご興味をお持ちいただけましたら、下記のフォームからお申し込みください。

🔗 継続プログラム申し込みフォーム
${process.env.NEXT_PUBLIC_BASE_URL}/apply/continue?email=${encodeURIComponent(clientEmail || 'client@example.com')}

【よくあるご質問】
Q: 継続プログラムの期間はどのくらいですか？
A: 通常3-6ヶ月間で、あなたのペースに合わせて調整いたします。

Q: トライアルだけでも効果はありましたが...
A: 継続することで、より深い変化と定着を実現できます。お気軽にご相談ください。

${clientName}さんの更なる成長と成功を心より願っております。
ご質問やご相談がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: mindengineeringcoaching@gmail.com
━━━━━━━━━━━━━━━━━━━━━━━━━━`
      
    } else if (completedSessionCount >= 6) {
      subject = '【MEC】プログラム完了おめでとうございます - 心からの感謝を込めて'
      content = `${clientName} 様

本日で6回のマインドエンジニアリング・コーチングプログラムが完了いたしました。
最後まで取り組んでいただき、誠にありがとうございました。

【完了プログラム】
・総セッション数: 6回
・最終セッション実施日: ${new Date(sessionDate).toLocaleString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit'
})}

🎉 プログラム完了おめでとうございます！

これまでの6回のセッションを通じて、${clientName}さんは大きく成長されました。
最初のセッションから今日まで、一歩一歩前進し続けるお姿を拝見し、
私たちも大変嬉しく思っております。

【今後について】
今回のプログラムで身につけたスキルとマインドセットを、
日々の生活や仕事に活かしていただければと思います。

また、今後もサポートが必要な場合や、追加のセッションをご希望の際は、
お気軽にご連絡ください。いつでも喜んでサポートさせていただきます。

【フォローアップについて】
3ヶ月後に成果確認のフォローアップメールをお送りいたします。
その際、ご質問や追加サポートのご要望もお聞かせください。

${clientName}さんの今後ますますのご活躍とご成功を心よりお祈りしております。
この度は、マインドエンジニアリング・コーチングをご利用いただき、
本当にありがとうございました。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: mindengineeringcoaching@gmail.com
━━━━━━━━━━━━━━━━━━━━━━━━━━`
      
    } else {
      const remainingSessions = 6 - completedSessionCount
      subject = '【MEC】セッションお疲れ様でした - 次回のご予約をお待ちしております'
      content = `${clientName} 様

本日は${completedSessionCount}回目のセッションにご参加いただき、誠にありがとうございました。

【実施セッション】
・日時: ${new Date(sessionDate).toLocaleString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit'
})}
・回数: ${completedSessionCount}回目 / 6回

今回のセッションはいかがでしたでしょうか？
回を重ねるごとに、新しい発見や成長を実感していただけていることと思います。

【プログラム進捗状況】
✅ 完了セッション: ${completedSessionCount}回
📅 残りセッション: ${remainingSessions}回

継続的な学習とサポートにより、さらなる成果を実感していただけるよう、
次回のセッションでもしっかりとサポートさせていただきます。

【次回セッションのご予約】
下記のリンクから、ご都合の良い日時をお選びください。

🔗 セッション予約フォーム
${bookingUrl}

【次回に向けて】
${completedSessionCount === 2 ? '• 今回学んだ技法を日常で実践してみてください\n• 疑問点があれば次回セッションでご質問ください' :
  completedSessionCount === 3 ? '• これまでの学習内容の振り返りを行います\n• より実践的な応用テクニックをお教えします' :
  completedSessionCount === 4 ? '• プログラム後半に向けた目標設定を行います\n• より高度なスキルの習得を目指しましょう' :
  '• プログラム最終段階です\n• 学習成果の総まとめと今後の活用方法をご提案します'}

【よくあるご質問】
Q: 次回までにどのくらい間隔を空けるべきですか？
A: 学習効果を最大化するため、2-3週間以内のご予約をおすすめしています。

Q: セッション内容で分からなかった部分があります
A: 次回セッションで丁寧にフォローアップいたしますので、お気軽にご質問ください。

${clientName}さんの継続的な成長を心よりサポートいたします。
次回のセッションを楽しみにお待ちしております。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: mindengineeringcoaching@gmail.com
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