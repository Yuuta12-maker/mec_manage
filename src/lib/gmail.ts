'use server'

import nodemailer from 'nodemailer'
import { supabase } from './supabase'

interface EmailData {
  to: string
  subject: string
  content: string
  type: 'application' | 'booking' | 'session_update'
  related_id?: string
}

export async function sendEmailWithGmail({ to, subject, content, type, related_id }: EmailData) {
  console.log('=== Gmail Email Debug Info ===')
  console.log('To:', to)
  console.log('Subject:', subject)
  
  try {
    // Gmail SMTP設定
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    const mailOptions = {
      from: `"MEC管理システム" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      text: content,
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
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 1000))
    
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