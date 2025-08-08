'use server'

import nodemailer from 'nodemailer'
import { supabase } from './supabase'

interface EmailData {
  to: string
  subject: string
  content: string
  type: 'application' | 'booking' | 'session_update' | 'next_session_promotion'
  related_id?: string
}

export async function sendEmailWithGmail({ to, subject, content, type, related_id }: EmailData) {
  console.log('=== Gmail Email Debug Info ===')
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('Type:', type)
  console.log('Related ID:', related_id)
  console.log('Gmail User:', process.env.GMAIL_USER ? 'Set' : 'Missing')
  console.log('Gmail Password:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Missing')
  console.log('Gmail User Value:', process.env.GMAIL_USER)
  console.log('Gmail Password Value:', process.env.GMAIL_APP_PASSWORD ? 'Length: ' + process.env.GMAIL_APP_PASSWORD.length : 'undefined')
  
  // Check if credentials are available
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    const error = 'Missing Gmail SMTP credentials. Please check GMAIL_USER and GMAIL_APP_PASSWORD environment variables.'
    console.error(error)
    return { success: false, error }
  }

  // キャリアメール判定
  const isCarrierEmail = to.includes('@docomo.ne.jp') || to.includes('@ezweb.ne.jp') || to.includes('@softbank.ne.jp') || to.includes('@au.com')
  console.log('Is carrier email:', isCarrierEmail)
  
  try {
    // Gmail SMTP設定
    const transporter = nodemailer.createTransport({
      service: isCarrierEmail ? undefined : 'gmail',
      host: isCarrierEmail ? 'smtp.gmail.com' : undefined,
      port: isCarrierEmail ? 465 : 587,
      secure: isCarrierEmail ? true : false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: isCarrierEmail ? 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256' : 'SSLv3'
      },
      // キャリアメール向けの厳格な設定
      pool: isCarrierEmail ? false : true,
      maxConnections: 1,
      maxMessages: 1,
      rateDelta: isCarrierEmail ? 10000 : 1000,
      rateLimit: 1,
      // 追加のオプション
      connectionTimeout: isCarrierEmail ? 60000 : 30000,
      greetingTimeout: isCarrierEmail ? 30000 : 15000,
      socketTimeout: isCarrierEmail ? 60000 : 30000
    } as any)

    // キャリアメール向けにコンテンツを最適化
    const optimizedContent = isCarrierEmail 
      ? content
          .replace(/━━━━━━━━━━━━━━━━━━━━━━━━━━/g, '') // 罫線を削除
          .replace(/・/g, '* ') // 中点を標準記号に
          .replace(/【/g, '[').replace(/】/g, ']') // 装飾文字を標準に
          .replace(/\n\n+/g, '\n') // 余分な改行を削除
          .trim()
          .substring(0, 500) // 文字数を大幅に制限
      : content

    const mailOptions = {
      from: isCarrierEmail 
        ? `MEC管理システム <${process.env.GMAIL_USER}>` // キャリアメールは装飾なし
        : `"MEC管理システム" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: isCarrierEmail 
        ? subject.replace(/【/g, '').replace(/】/g, '') // 装飾文字を削除
                 .replace(/MEC/g, 'MEC') // 英数字のみ
                 .substring(0, 20) // 件名を短く
        : subject,
      text: optimizedContent,
      headers: isCarrierEmail 
        ? {
            'X-Mailer': 'MEC',
            'Reply-To': process.env.GMAIL_USER || '',
          } as { [key: string]: string }
        : {
            'X-Mailer': 'MEC Management System',
            'X-Priority': '1',
            'Importance': 'high',
            'Reply-To': process.env.GMAIL_USER || '',
          } as { [key: string]: string }
    }

    console.log('Sending email with Gmail SMTP...')
    const result = await transporter.sendMail(mailOptions)
    console.log('Gmail SMTP result:', result)

    // メール送信履歴を保存
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient: to,
        subject,
        content,
        type,
        related_id,
        status: 'sent',
        error_message: null,
        sent_at: new Date().toISOString(),
      })

    if (logError) {
      console.error('Failed to log email:', logError)
    }

    console.log('Email sent successfully with Gmail')
    return { success: true, data: result }
  } catch (error) {
    console.error('Gmail email sending error:', error)
    
    // エラーの場合もログに記録
    await supabase
      .from('email_logs')
      .insert({
        recipient: to,
        subject,
        content,
        type,
        related_id,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        sent_at: new Date().toISOString(),
      })

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 申し込み完了メール（Gmail版）
export async function sendApplicationEmailsWithGmail(applicantEmail: string, applicantName: string, applicationId: string) {
  try {
    console.log('=== sendApplicationEmailsWithGmail called ===')
    const adminEmail = process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'

    // 応募者向けメール
    const applicantSubject = '【MEC】お申し込みを受け付けました'
    const applicantContent = `${applicantName} 様

この度は、マインドエンジニアリング・コーチング（MEC）にお申し込みいただき、誠にありがとうございます。

お申し込み内容を確認いたしました。

【今後の流れ】
1. 担当者より2営業日以内にご連絡いたします
2. トライアルセッションの日程調整を行います
3. セッション予約フォームをお送りします

ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${adminEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // 管理者向けメール
    const adminSubject = '【MEC】新規申し込みがありました'
    const adminContent = `新規申し込みがありました。

【申し込み情報】
・お名前: ${applicantName}
・メールアドレス: ${applicantEmail}
・申し込みID: ${applicationId}

管理画面から詳細を確認し、対応をお願いします。

管理画面URL: ${process.env.NEXT_PUBLIC_BASE_URL}/clients`

    // 両方のメールを逐次送信
    console.log('=== Sending Application Emails with Gmail ===')
    console.log('Applicant email:', applicantEmail)
    console.log('Admin email:', adminEmail)
    
    // 応募者向けメールを先に送信
    const applicantResult = await sendEmailWithGmail({
      to: applicantEmail,
      subject: applicantSubject,
      content: applicantContent,
      type: 'application',
      related_id: applicationId,
    })
    
    // より長い待機時間でレート制限を回避
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 管理者向けメールを送信
    const adminResult = await sendEmailWithGmail({
      to: adminEmail,
      subject: adminSubject,
      content: adminContent,
      type: 'application',
      related_id: applicationId,
    })

    console.log('Applicant email result:', applicantResult)
    console.log('Admin email result:', adminResult)

    return {
      applicantResult,
      adminResult,
      success: applicantResult.success && adminResult.success,
    }
  } catch (error) {
    console.error('sendApplicationEmailsWithGmail error:', error)
    return {
      applicantResult: { success: false, error: 'Function error' },
      adminResult: { success: false, error: 'Function error' },
      success: false,
    }
  }
}

// セッション予約完了メール（Gmail版）
export async function sendBookingEmailsWithGmail(
  clientEmail: string,
  clientName: string,
  sessionDate: string,
  sessionType: string,
  meetLink?: string,
  sessionId?: string
) {
  try {
    console.log('=== sendBookingEmailsWithGmail called ===')
    const adminEmail = process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'

    // クライアント向けメール
    const clientSubject = '【MEC】セッション予約が完了しました'
    const clientContent = `${clientName} 様

セッションのご予約が完了いたしました。

【予約内容】
・セッション種別: ${sessionType === 'trial' ? 'トライアル' : '通常セッション'}
・予定日時: ${new Date(sessionDate).toLocaleString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit'
})}
${meetLink ? `・Google Meet URL: ${meetLink}` : ''}

【セッション前の準備】
・静かな環境でご参加ください
・カメラとマイクの動作確認をお願いします
・筆記用具をご準備ください

ご質問やご不明な点がございましたら、お気軽にお問い合わせください。

当日お会いできることを楽しみにしております。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${adminEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // 管理者向けメール
    const adminSubject = '【MEC】新規セッション予約がありました'
    const adminContent = `新規セッション予約がありました。

【予約情報】
・お名前: ${clientName}
・メールアドレス: ${clientEmail}
・セッション種別: ${sessionType === 'trial' ? 'トライアル' : '通常セッション'}
・予定日時: ${new Date(sessionDate).toLocaleString('ja-JP')}
${meetLink ? `・Google Meet URL: ${meetLink}` : ''}
${sessionId ? `・セッションID: ${sessionId}` : ''}

管理画面から詳細を確認してください。

管理画面URL: ${process.env.NEXT_PUBLIC_BASE_URL}/sessions`

    // 両方のメールを逐次送信
    console.log('=== Sending Booking Emails with Gmail ===')
    console.log('Client email:', clientEmail)
    console.log('Admin email:', adminEmail)
    console.log('Client email length:', clientEmail.length)
    console.log('Admin email length:', adminEmail.length)
    
    // クライアント向けメールを先に送信
    const clientResult = await sendEmailWithGmail({
      to: clientEmail,
      subject: clientSubject,
      content: clientContent,
      type: 'booking',
      related_id: sessionId,
    })
    
    // キャリアメールの場合はより長い待機時間
    const waitTime = (clientEmail.includes('@docomo.ne.jp') || clientEmail.includes('@ezweb.ne.jp') || 
                     clientEmail.includes('@softbank.ne.jp') || clientEmail.includes('@au.com') ||
                     adminEmail.includes('@docomo.ne.jp') || adminEmail.includes('@ezweb.ne.jp') || 
                     adminEmail.includes('@softbank.ne.jp') || adminEmail.includes('@au.com')) ? 10000 : 2000
    console.log('Wait time for next email:', waitTime, 'ms')
    await new Promise(resolve => setTimeout(resolve, waitTime))
    
    // 管理者向けメールを送信
    const adminResult = await sendEmailWithGmail({
      to: adminEmail,
      subject: adminSubject,
      content: adminContent,
      type: 'booking',
      related_id: sessionId,
    })
    
    console.log('Client email result:', clientResult)
    console.log('Admin email result:', adminResult)

    return {
      clientResult,
      adminResult,
      success: clientResult.success && adminResult.success,
    }
  } catch (error) {
    console.error('sendBookingEmailsWithGmail error:', error)
    return {
      clientResult: { success: false, error: 'Function error' },
      adminResult: { success: false, error: 'Function error' },
      success: false,
    }
  }
}

// クライアントの完了セッション数を取得
async function getClientCompletedSessionCount(clientId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('Error fetching session count:', error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error('Error in getClientCompletedSessionCount:', error)
    return 0
  }
}

// セッション終了後の次回予約促進メール（Gmail版）
export async function sendNextSessionPromotionEmailWithGmail(
  clientEmail: string,
  clientName: string,
  completedSessionId: string,
  sessionType: string,
  sessionDate: string,
  clientId: string
) {
  try {
    console.log('=== sendNextSessionPromotionEmailWithGmail called ===')
    
    // 完了セッション数を取得（今回完了したセッションを含む）
    const completedSessionCount = await getClientCompletedSessionCount(clientId)
    console.log('Completed session count:', completedSessionCount)
    console.log('Session type:', sessionType)
    
    const bookingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/booking`
    
    // セッション回数とタイプに応じてメール内容を変更
    let subject: string
    let content: string
    
    if (sessionType === 'trial') {
      // トライアルセッション：継続のお誘い
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
${process.env.NEXT_PUBLIC_BASE_URL}/apply/continue?email=${encodeURIComponent(clientEmail)}

【よくあるご質問】
Q: 継続プログラムの期間はどのくらいですか？
A: 通常3-6ヶ月間で、あなたのペースに合わせて調整いたします。

Q: トライアルだけでも効果はありましたが...
A: 継続することで、より深い変化と定着を実現できます。お気軽にご相談ください。

${clientName}さんの更なる成長と成功を心より願っております。
ご質問やご相談がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'}
━━━━━━━━━━━━━━━━━━━━━━━━━━`
      
    } else if (completedSessionCount >= 6) {
      // 6回目（最終）：お礼のメッセージ
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
Email: ${process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'}
━━━━━━━━━━━━━━━━━━━━━━━━━━`
      
    } else {
      // 2-5回目：次回セッションの予約
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
Email: ${process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'}
━━━━━━━━━━━━━━━━━━━━━━━━━━`
    }

    console.log('=== Sending Next Session Promotion Email with Gmail ===')
    console.log('Client email:', clientEmail)
    
    const result = await sendEmailWithGmail({
      to: clientEmail,
      subject: subject,
      content: content,
      type: 'next_session_promotion',
      related_id: completedSessionId,
    })
    
    console.log('Next session promotion email result:', result)
    return result
  } catch (error) {
    console.error('sendNextSessionPromotionEmailWithGmail error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 継続申し込み完了メール（Gmail版）
export async function sendContinuationApplicationEmailsWithGmail(
  applicantEmail: string,
  applicantName: string,
  applicationId: string,
  programType: string,
  goals: string
) {
  try {
    console.log('=== sendContinuationApplicationEmailsWithGmail called ===')
    const adminEmail = process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'

    // 申込者向けメール
    const applicantSubject = '【MEC】継続プログラムお申し込みを受け付けました'
    const applicantContent = `${applicantName} 様

この度は、マインドエンジニアリング・コーチング継続プログラムにお申し込みいただき、誠にありがとうございます。

お申し込み内容を確認いたしました。

【お申し込み内容】
・プログラムタイプ: ${programType === '6sessions' ? '6回コース' : programType === '12sessions' ? '12回コース' : 'カスタムプラン'}
・目標: ${goals.substring(0, 100)}${goals.length > 100 ? '...' : ''}

【今後の流れ】
1. 担当者より2営業日以内にご連絡いたします
2. プログラム詳細と料金のご案内
3. セッションスケジュールの調整
4. 継続プログラム開始

トライアルセッションでの学びを基に、さらに深い成果を実現できるよう、
全力でサポートさせていただきます。

ご不明な点がございましたら、お気軽にお問い合わせください。
${applicantName}さんの継続的な成長を心よりお手伝いさせていただきます。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${adminEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // 管理者向けメール
    const adminSubject = '【MEC】継続プログラム申し込みがありました'
    const adminContent = `継続プログラムの申し込みがありました。

【申し込み情報】
・お名前: ${applicantName}
・メールアドレス: ${applicantEmail}
・申し込みID: ${applicationId}
・プログラムタイプ: ${programType}

【申し込み内容】
・目標: ${goals}

管理画面から詳細を確認し、対応をお願いします。

管理画面URL: ${process.env.NEXT_PUBLIC_BASE_URL}/admin/continuation-applications`

    // 両方のメールを逐次送信
    console.log('=== Sending Continuation Application Emails with Gmail ===')
    console.log('Applicant email:', applicantEmail)
    console.log('Admin email:', adminEmail)
    
    // 申込者向けメールを先に送信
    const applicantResult = await sendEmailWithGmail({
      to: applicantEmail,
      subject: applicantSubject,
      content: applicantContent,
      type: 'application',
      related_id: applicationId,
    })
    
    // 待機時間
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 管理者向けメールを送信
    const adminResult = await sendEmailWithGmail({
      to: adminEmail,
      subject: adminSubject,
      content: adminContent,
      type: 'application',
      related_id: applicationId,
    })

    console.log('Applicant email result:', applicantResult)
    console.log('Admin email result:', adminResult)

    return {
      applicantResult,
      adminResult,
      success: applicantResult.success && adminResult.success,
    }
  } catch (error) {
    console.error('sendContinuationApplicationEmailsWithGmail error:', error)
    return {
      applicantResult: { success: false, error: 'Function error' },
      adminResult: { success: false, error: 'Function error' },
      success: false,
    }
  }
}