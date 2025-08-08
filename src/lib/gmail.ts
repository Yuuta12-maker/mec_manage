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

// セッション終了後の次回予約促進メール（Gmail版）
export async function sendNextSessionPromotionEmailWithGmail(
  clientEmail: string,
  clientName: string,
  completedSessionId: string,
  sessionType: string,
  sessionDate: string
) {
  try {
    console.log('=== sendNextSessionPromotionEmailWithGmail called ===')
    
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
Email: ${process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'}
━━━━━━━━━━━━━━━━━━━━━━━━━━`

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