'use server'

import { Resend } from 'resend'
import { supabase } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailData {
  to: string
  subject: string
  content: string
  type: 'application' | 'booking' | 'session_update'
  related_id?: string
}

export async function sendEmail({ to, subject, content, type, related_id }: EmailData) {
  console.log('=== Email Debug Info ===')
  console.log('API Key:', process.env.RESEND_API_KEY ? 'Set' : 'Missing')
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('From:', 'onboarding@resend.dev')
  
  try {
    console.log('Sending email with Resend API...')
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Resendの標準テスト用アドレス
      to: [to],
      subject,
      text: content,
    })
    
    console.log('Resend API response - data:', data)
    console.log('Resend API response - error:', error)

    // メール送信履歴を保存
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient: to,
        subject,
        content,
        type,
        related_id,
        status: error ? 'failed' : 'sent',
        error_message: error?.message || null,
        sent_at: new Date().toISOString(),
      })

    if (logError) {
      console.error('Failed to log email:', logError)
    }

    if (error) {
      console.error('Resend API Error:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      throw new Error(`Email sending failed: ${error.message || JSON.stringify(error)}`)
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Email sending error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
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

// 申し込み完了メール
export async function sendApplicationEmails(applicantEmail: string, applicantName: string, applicationId: string) {
  try {
    console.log('=== sendApplicationEmails called ===')
    const adminEmail = 'mindengineeringcoaching@gmail.com'

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

  // 両方のメールを逐次送信（並列ではなく）
  console.log('=== Sending Application Emails ===')
  console.log('Applicant email:', applicantEmail)
  console.log('Admin email:', adminEmail)
  
  // 応募者向けメールを先に送信
  const applicantResult = await sendEmail({
    to: applicantEmail,
    subject: applicantSubject,
    content: applicantContent,
    type: 'application',
    related_id: applicationId,
  })
  
  // 少し待機
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 管理者向けメールを送信
  const adminResult = await sendEmail({
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
    console.error('sendApplicationEmails error:', error)
    return {
      applicantResult: { success: false, error: 'Function error' },
      adminResult: { success: false, error: 'Function error' },
      success: false,
    }
  }
}

// セッション予約完了メール
export async function sendBookingEmails(
  clientEmail: string,
  clientName: string,
  sessionDate: string,
  sessionType: string,
  meetLink?: string,
  sessionId?: string
) {
  try {
    console.log('=== sendBookingEmails called ===')
    const adminEmail = 'mindengineeringcoaching@gmail.com'

  // 応募者向けメール
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
  console.log('=== Sending Booking Emails ===')
  console.log('Client email:', clientEmail)
  console.log('Admin email:', adminEmail)
  
  // クライアント向けメールを先に送信
  const clientResult = await sendEmail({
    to: clientEmail,
    subject: clientSubject,
    content: clientContent,
    type: 'booking',
    related_id: sessionId,
  })
  
  // 少し待機
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 管理者向けメールを送信
  const adminResult = await sendEmail({
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
    console.error('sendBookingEmails error:', error)
    return {
      clientResult: { success: false, error: 'Function error' },
      adminResult: { success: false, error: 'Function error' },
      success: false,
    }
  }
}