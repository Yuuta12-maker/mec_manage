'use server'

import nodemailer from 'nodemailer'
import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'

// サーバーサイド用のSupabaseクライアント（RLS回避）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('=== Supabase Admin Client Debug ===')
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('Service Key Source:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key' : 'Anon Key (Fallback)')
console.log('Service Key Present:', supabaseServiceKey ? 'Set' : 'Missing')

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is not set! Using anon key which may have limited permissions.')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface EmailData {
  to: string
  subject: string
  content: string
  type: 'application' | 'booking' | 'session_update' | 'next_session_promotion'
  related_id?: string
  session_id?: string
  client_id?: string
}

export async function sendEmailWithGmail({ to, subject, content, type, related_id, session_id, client_id }: EmailData) {
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
    console.log('=== Saving email to history ===')
    const emailHistoryData = {
      session_id: session_id || null,
      client_id: client_id || null,
      email_type: type,
      subject,
      recipient_email: to,
      status: 'sent',
      sent_at: new Date().toISOString(),
      error_message: null
    }
    console.log('Email history data to insert:', JSON.stringify(emailHistoryData, null, 2))
    console.log('Using Supabase client with key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon Key')
    
    try {
      const { data: insertData, error: logError } = await supabaseAdmin
        .from('email_history')
        .insert(emailHistoryData)
        .select()

      console.log('Email history insert result:', { data: insertData, error: logError })
      
      if (logError) {
        console.error('❌ Failed to log email:', logError)
        console.error('❌ Log error details:', JSON.stringify(logError, null, 2))
        console.error('❌ Error code:', logError.code)
        console.error('❌ Error message:', logError.message)
        console.error('❌ Error details:', logError.details)
      } else {
        console.log('✅ Email history saved successfully:', insertData)
        console.log('✅ Inserted record count:', insertData?.length || 0)
      }
    } catch (error) {
      console.error('❌ Exception while inserting email history:', error)
    }

    console.log('Email sent successfully with Gmail')
    return { success: true, data: result }
  } catch (error) {
    console.error('Gmail email sending error:', error)
    
    // エラーの場合もログに記録
    console.log('=== Saving failed email to history ===')
    const failedEmailData = {
      session_id: session_id || null,
      client_id: client_id || null,
      email_type: type,
      subject,
      recipient_email: to,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      sent_at: null
    }
    console.log('Failed email history data to insert:', JSON.stringify(failedEmailData, null, 2))
    
    try {
      const { data: failedInsertData, error: failedLogError } = await supabaseAdmin
        .from('email_history')
        .insert(failedEmailData)
        .select()

      console.log('Failed email history insert result:', { data: failedInsertData, error: failedLogError })
      
      if (failedLogError) {
        console.error('❌ Failed to log failed email:', failedLogError)
        console.error('❌ Failed log error details:', JSON.stringify(failedLogError, null, 2))
      } else {
        console.log('✅ Failed email history saved successfully:', failedInsertData)
      }
    } catch (insertError) {
      console.error('❌ Exception while inserting failed email history:', insertError)
    }

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// 申し込み完了メール（Gmail版）
export async function sendApplicationEmailsWithGmail(applicantEmail: string, applicantName: string, applicationId: string) {
  try {
    console.log('=== sendApplicationEmailsWithGmail called ===')
    const adminEmail = process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'

    // 応募者向けメール
    const applicantSubject = '【MEC】お申し込みありがとうございます - セッション予約のご案内'
    const applicantContent = `${applicantName} 様

この度は、マインドエンジニアリング・コーチング（MEC）にお申し込みいただき、誠にありがとうございます。

お申し込み内容を確認いたしました。

【今後の流れ】
1. 下記リンクからトライアルセッションをご予約ください
2. セッション実施（30分程度）
3. 継続プログラムについてご相談

【セッション予約フォーム】
以下のリンクからご都合の良い日時をお選びください：
🔗 https://mec-manage.vercel.app/booking

※ご予約は先着順となります。お早めにお手続きください。

【トライアルセッションについて】
・料金：6,000円（税込）
・時間：30分程度
・形式：オンライン（Google Meet）または対面
・内容：現状の課題把握と改善方向性の提示

【お支払いについて】
銀行振込でお支払いをお願いいたします。
以下の口座にトライアルセッション料金をお振込ください。

━━━━━━━━━━━━━━━━━━━━━━━━━━
【振込先情報】
銀行名：ゆうちょ銀行
支店名：六一八店（支店番号：618）
口座種別：普通預金
口座番号：13960311
口座名義：モリヤマ ユウタ
━━━━━━━━━━━━━━━━━━━━━━━━━━

・振込金額：6,000円
・振込期限：お申し込みから7日以内
・振込手数料：お客様ご負担
・振込名義：お申し込み時のお名前でお振込ください

※振込確認後、セッション予約が可能になります。
※振込が確認できましたら、確認メールをお送りいたします。

【ご準備いただくもの】
・静かな環境（オンラインの場合）
・筆記用具
・現在お悩みの具体的な課題（簡単にまとめておいてください）
・Googleアカウント（オンラインセッションの場合、Google Meetを使用します）

【オンラインセッションについて】
※オンラインセッションをご希望の場合、Google Meetを使用いたします。
※Google Meetのご利用にはGoogleアカウントが必要です。
※アカウントをお持ちでない場合は、事前に作成をお願いいたします（5分程度で完了）。

ご質問やご不明な点がございましたら、お気軽にお問い合わせください。
${applicantName}さんとお会いできることを楽しみにしております。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${adminEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // 管理者向けメール
    const adminSubject = '【MEC】新規申し込み（銀行振込） - 振込確認待ち'
    const adminContent = `新規申し込みがありました（銀行振込）。

【申し込み情報】
・お名前: ${applicantName}
・メールアドレス: ${applicantEmail}
・申し込みID: ${applicationId}
・支払い方法: 銀行振込

【振込先情報】
・ゆうちょ銀行 六一八店（618）
・普通預金 13960311
・モリヤマ ユウタ
・振込金額: 6,000円
・振込期限: 7日以内

【対応状況】
✅ 申込者向けに振込先情報付き確認メールを自動送信済み
💳 振込確認待ち（7日以内）
📅 振込確認後にセッション予約が可能

【必要なアクション】
1. 振込確認（ゆうちょ銀行の通帳・アプリで確認）
2. 振込確認できたら申込者にメール連絡
3. 申込者からのセッション予約を待つ

【管理画面】
詳細確認・管理：${process.env.NEXT_PUBLIC_BASE_URL}/clients
予約状況確認：${process.env.NEXT_PUBLIC_BASE_URL}/sessions

※振込確認後、申込者はセッション予約可能になります。`

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
    const clientSubject = '【MEC】セッション予約完了 - 当日のご案内'
    const clientContent = `${clientName} 様

セッションのご予約をいただき、ありがとうございます！
ご予約が正常に完了いたしました。

【ご予約内容】
・セッション種別: ${sessionType === 'trial' ? 'トライアルセッション' : '通常セッション'}
・実施日時: ${new Date(sessionDate).toLocaleString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit'
})}
・コーチ: 森山雄太
・実施方法: ${meetLink ? `オンライン（Google Meet）` : '対面'}
${meetLink ? `・Google Meet URL: ${meetLink}` : ''}

【セッション前の準備】
📝 ご準備いただくもの：
・筆記用具（メモを取っていただきます）
・現在のお悩みや課題を簡単にまとめておいてください
・リラックスできる服装でお越しください

${meetLink ? `💻 オンラインセッションについて：
・上記のGoogle Meet URLからセッションにご参加ください
・セッション開始5分前にはMeetにアクセスをお願いします
・静かな環境でご参加ください
・カメラとマイクの動作確認を事前にお願いします
・Google Meetを使用するため、Googleアカウントが必要です
・アカウントをお持ちでない場合は、事前に作成をお願いいたします（5分程度で完了）
・万が一接続に問題がある場合は、お気軽にご連絡ください` : `🏢 対面セッションについて：
・会場の詳細は別途ご連絡いたします
・お時間に余裕をもってお越しください`}

【当日の流れ】
1. 自己紹介・現状確認（5分）
2. 課題の整理と目標設定（10分）
3. 具体的な改善手法のご提案（10分）
4. 質疑応答・次回以降のご相談（5分）

${sessionType === 'trial' ? `【トライアル後について】
セッション後に継続プログラムについてご相談させていただきます。
無理な勧誘は一切ございませんので、ご安心ください。` : ''}

何かご質問やご不安な点がございましたら、お気軽にお問い合わせください。
${clientName}さんとお会いできることを心より楽しみにしております。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
コーチ: 森山雄太
Email: ${adminEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // 管理者向けメール
    const adminSubject = '【MEC】📅 セッション予約通知 - 対応必要'
    const adminContent = `新規セッション予約が完了しました。

【予約情報】
・お名前: ${clientName}
・メールアドレス: ${clientEmail}
・セッション種別: ${sessionType === 'trial' ? '🔰 トライアルセッション' : '📚 通常セッション'}
・実施日時: ${new Date(sessionDate).toLocaleString('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit'
})}
・実施形式: ${meetLink ? 'オンライン（Google Meet）' : '対面'}
${meetLink ? `・Meet URL: ${meetLink}` : ''}
${sessionId ? `・セッションID: ${sessionId}` : ''}

【対応状況】
✅ クライアント向けに予約完了メールを自動送信済み
📋 セッション詳細情報が管理画面に登録済み

【必要なアクション】
${sessionType === 'trial' ? `・トライアルセッション準備
・料金確認（6,000円）
・継続プログラム資料の準備` : `・通常セッション準備
・前回セッションからの進捗確認
・今回の目標設定`}

【管理画面】
セッション詳細: ${process.env.NEXT_PUBLIC_BASE_URL}/sessions/${sessionId || ''}
クライアント情報: ${process.env.NEXT_PUBLIC_BASE_URL}/clients
全セッション一覧: ${process.env.NEXT_PUBLIC_BASE_URL}/sessions

※セッション開始時刻の確認をお願いします。`

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
      session_id: sessionId,
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
      session_id: sessionId,
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
    const { data, error } = await supabaseAdmin
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
      subject = '【MEC】継続プログラムのご案内'
      content = `${clientName} 様

本日はトライアルセッションにご参加いただき、ありがとうございました。

【継続プログラムについて】
• 6回のセッション（6ヶ月間・月1回）
• 料金: ¥214,000（税込）

継続プログラムにご興味をお持ちいただけましたら、下記からお申し込みください。

🔗 継続プログラム申し込みフォーム
${process.env.NEXT_PUBLIC_BASE_URL}/apply/continue?email=${encodeURIComponent(clientEmail)}&session=${completedSessionId}

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

    console.log('=== Sending Next Session Promotion Email with Gmail ===')
    console.log('Client email:', clientEmail)
    
    const result = await sendEmailWithGmail({
      to: clientEmail,
      subject: subject,
      content: content,
      type: 'next_session_promotion',
      related_id: completedSessionId,
      session_id: completedSessionId,
      client_id: clientId,
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

// トライアル決済完了メール（Gmail版）- 申込・決済完了統合版
export async function sendTrialPaymentCompletionEmailsWithGmail(
  clientEmail: string,
  clientName: string,
  clientId: string,
  amount: number
) {
  try {
    console.log('=== sendTrialApplicationAndPaymentCompletionEmailsWithGmail called ===')
    const adminEmail = process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'

    // クライアント向けメール（申込完了と決済完了を統合）
    const clientSubject = '【MEC】お申し込み・決済完了 - セッション予約のご案内'
    const clientContent = `${clientName} 様

この度は、マインドエンジニアリング・コーチング（MEC）のトライアルセッションにお申し込みいただき、誠にありがとうございます。

お申し込み内容を確認し、決済が正常に完了いたしました。

【お申し込み・決済完了内容】
・料金: ¥${amount.toLocaleString()}（税込）
・セッション: トライアルセッション（30分）
・お名前: ${clientName} 様
・メールアドレス: ${clientEmail}

【今後の流れ】
1. 下記リンクからトライアルセッションをご予約ください
2. セッション実施（30分程度）
3. 継続プログラムについてご相談

【セッション予約フォーム】
以下のリンクからご都合の良い日時をお選びください：
🔗 https://mec-manage.vercel.app/booking

※ご予約は先着順となります。お早めにお手続きください。

【トライアルセッションについて】
・料金: ¥${amount.toLocaleString()}（税込・決済完了済み）
・時間: 30分程度
・形式: オンライン（Google Meet）または対面
・内容: 現状の課題把握と改善方向性の提示

【ご準備いただくもの】
・静かな環境（オンラインの場合）
・筆記用具
・現在お悩みの具体的な課題（簡単にまとめておいてください）
・Googleアカウント（オンラインセッションの場合、Google Meetを使用します）

【オンラインセッションについて】
※オンラインセッションをご希望の場合、Google Meetを使用いたします。
※Google Meetのご利用にはGoogleアカウントが必要です。
※アカウントをお持ちでない場合は、事前に作成をお願いいたします（5分程度で完了）。

ご質問やご不明な点がございましたら、お気軽にお問い合わせください。
${clientName}さんとお会いできることを楽しみにしております。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${adminEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // 管理者向けメール
    const adminSubject = '【MEC】トライアル申込・決済完了 - セッション予約待ち'
    const adminContent = `トライアルセッションの申込・決済が完了しました。

【申込・決済情報】
・お名前: ${clientName}
・メールアドレス: ${clientEmail}
・クライアントID: ${clientId}
・決済金額: ¥${amount.toLocaleString()}

【対応状況】
✅ 申込・決済完了メールを自動送信済み
📅 クライアントはセッション予約フォームから予約可能
⏰ 予約完了時に管理者向けに通知メール送信

【管理画面】
クライアント詳細: ${process.env.NEXT_PUBLIC_BASE_URL}/clients
セッション管理: ${process.env.NEXT_PUBLIC_BASE_URL}/sessions

※クライアントが予約完了次第、別途通知いたします。`

    // 両方のメールを逐次送信
    console.log('=== Sending Trial Payment Completion Emails with Gmail ===')
    console.log('Client email:', clientEmail)
    console.log('Admin email:', adminEmail)
    
    // クライアント向けメールを先に送信
    const clientResult = await sendEmailWithGmail({
      to: clientEmail,
      subject: clientSubject,
      content: clientContent,
      type: 'application',
      related_id: clientId,
      client_id: clientId,
    })
    
    // 待機時間
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 管理者向けメールを送信
    const adminResult = await sendEmailWithGmail({
      to: adminEmail,
      subject: adminSubject,
      content: adminContent,
      type: 'application',
      related_id: clientId,
      client_id: clientId,
    })

    console.log('Client email result:', clientResult)
    console.log('Admin email result:', adminResult)

    return {
      clientResult,
      adminResult,
      success: clientResult.success && adminResult.success,
    }
  } catch (error) {
    console.error('sendTrialPaymentCompletionEmailsWithGmail error:', error)
    return {
      clientResult: { success: false, error: 'Function error' },
      adminResult: { success: false, error: 'Function error' },
      success: false,
    }
  }
}

// 継続プログラム決済完了メール（Gmail版）
export async function sendContinuationPaymentCompletionEmailsWithGmail(
  applicantEmail: string,
  applicantName: string,
  applicationId: string,
  amount: number
) {
  try {
    console.log('=== sendContinuationPaymentCompletionEmailsWithGmail called ===')
    const adminEmail = process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'

    // 申込者向けメール
    const applicantSubject = '【MEC】継続プログラムの決済が完了しました - プログラム開始準備'
    const applicantContent = `${applicantName} 様

この度は、マインドエンジニアリング・コーチング継続プログラムの決済が正常に完了いたしました。
誠にありがとうございます。

【決済情報】
・決済金額: ¥${amount.toLocaleString()}（税込）
・申し込みID: ${applicationId}
・決済日時: ${new Date().toLocaleDateString('ja-JP')} ${new Date().toLocaleTimeString('ja-JP')}

【プログラム内容】
・セッション回数: 6回
・実施期間: 6ヶ月間
・各セッション: 30分程度
・実施形式: オンライン（Google Meet）または対面

【今後の流れ】
1. 下記のリンクから個別セッションをご予約ください
2. プログラム詳細資料をお送りします
3. 継続セッション開始

【セッション予約フォーム】
以下のリンクからご都合の良い日時でセッションをご予約ください：
${process.env.NEXT_PUBLIC_BASE_URL}/booking

※セッション種別は「通常セッション」を選択してください
※ご不明な点がございましたら、お気軽にお問い合わせください

トライアルセッションでの学びを基に、さらに深い成果を実現できるよう、
全力でサポートさせていただきます。

継続プログラムを通じて、${applicantName}さんの目標達成を心よりサポートいたします。
ご質問やご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${adminEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // 管理者向けメール
    const adminSubject = '【MEC】継続プログラム決済完了 - セッション開始準備'
    const adminContent = `継続プログラムの決済が完了しました。

【決済情報】
・お名前: ${applicantName}
・メールアドレス: ${applicantEmail}
・申し込みID: ${applicationId}
・決済金額: ¥${amount.toLocaleString()}
・決済日時: ${new Date().toLocaleDateString('ja-JP')} ${new Date().toLocaleTimeString('ja-JP')}

【対応状況】
✅ 決済完了
✅ 申込者向けに決済完了確認メールを自動送信済み（セッション予約フォームリンク含む）
✅ クライアントステータス: Active
📅 クライアント自身でセッション予約可能

【必要なアクション】
1. プログラム詳細資料の送付
2. クライアントからのセッション予約を確認
3. 予約されたセッションの準備

【管理画面】
クライアント管理: ${process.env.NEXT_PUBLIC_BASE_URL}/clients
セッション管理: ${process.env.NEXT_PUBLIC_BASE_URL}/sessions
継続申し込み管理: ${process.env.NEXT_PUBLIC_BASE_URL}/admin/continuation-applications

※継続プログラムが開始できる状態になりました。クライアントが自身でセッション予約を行います。`

    // 両方のメールを逐次送信
    console.log('=== Sending Continuation Payment Completion Emails with Gmail ===')
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
    console.error('sendContinuationPaymentCompletionEmailsWithGmail error:', error)
    return {
      applicantResult: { success: false, error: 'Function error' },
      adminResult: { success: false, error: 'Function error' },
      success: false,
    }
  }
}

// 継続申し込み完了メール（Gmail版）
export async function sendContinuationApplicationEmailsWithGmail(
  applicantEmail: string,
  applicantName: string,
  applicationId: string,
  programType: string,
  goals: string,
  paymentMethod: string = 'credit_card'
) {
  try {
    console.log('=== sendContinuationApplicationEmailsWithGmail called ===')
    const adminEmail = process.env.GMAIL_USER || 'mindengineeringcoaching@gmail.com'

    // 決済方法に応じたメール内容を生成
    const getBankTransferInfo = () => {
      if (paymentMethod === 'bank_transfer') {
        return `
【お振込先情報】
銀行名: 楽天銀行
支店名: 第二営業支店 (252)
口座種別: 普通預金
口座番号: 7654321
口座名義: モリヤマ ユウタ（森山雄太）

振込金額: ¥214,000
振込期限: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}

※振込手数料はお客様のご負担となります
※お振込名義は登録されたお名前と同じ名義でお願いいたします
※お振込確認後、1営業日以内にセッション予約のご案内をお送りいたします`
      }
      return ''
    }

    // 申込者向けメール
    const applicantSubject = paymentMethod === 'bank_transfer' 
      ? '【MEC】継続プログラムお申し込み完了 - お振込先のご案内'
      : '【MEC】継続プログラムお申し込みを受け付けました'
      
    const applicantContent = `${applicantName} 様

この度は、マインドエンジニアリング・コーチング継続プログラムにお申し込みいただき、誠にありがとうございます。

お申し込み内容を確認いたしました。

【お申し込み内容】
・プログラムタイプ: ${programType === '6sessions' ? '6回コース（¥214,000）' : programType === '12sessions' ? '12回コース' : 'カスタムプラン'}
・決済方法: ${paymentMethod === 'bank_transfer' ? '銀行振込' : paymentMethod === 'credit_card' ? 'クレジットカード' : paymentMethod}
${getBankTransferInfo()}

【今後の流れ】
${paymentMethod === 'bank_transfer' ? 
  `1. 上記銀行口座へ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}までにお振込みください
2. お振込み確認後、1営業日以内にセッション予約のご案内をお送りします
3. セッションスケジュールの調整
4. 継続プログラム開始` :
  `1. 担当者より2営業日以内にご連絡いたします
2. プログラム詳細と料金のご案内
3. セッションスケジュールの調整
4. 継続プログラム開始`}

トライアルセッションでの学びを基に、さらに深い成果を実現できるよう、
全力でサポートさせていただきます。

ご不明な点がございましたら、お気軽にお問い合わせください。
${applicantName}さんの継続的な成長を心よりお手伝いさせていただきます。

━━━━━━━━━━━━━━━━━━━━━━━━━━
マインドエンジニアリング・コーチング
Email: ${adminEmail}
━━━━━━━━━━━━━━━━━━━━━━━━━━`

    // 管理者向けメール
    const adminSubject = paymentMethod === 'bank_transfer' 
      ? '【MEC】継続プログラム申し込み（銀行振込）- 入金確認要'
      : '【MEC】継続プログラム申し込みがありました'
      
    const adminContent = `継続プログラムの申し込みがありました。

【申し込み情報】
・お名前: ${applicantName}
・メールアドレス: ${applicantEmail}
・申し込みID: ${applicationId}
・プログラムタイプ: ${programType}
・決済方法: ${paymentMethod === 'bank_transfer' ? '銀行振込（¥214,000）' : paymentMethod === 'credit_card' ? 'クレジットカード' : paymentMethod}

【申し込み内容】
・目標: ${goals}

${paymentMethod === 'bank_transfer' ? 
  `【銀行振込の対応】
・お客様には振込先情報を自動送信済みです
・振込期限: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}
・入金確認後、振込確認管理画面で「入金確認」処理を行ってください
・その後、セッション予約の案内を送信してください

振込確認画面: ${process.env.NEXT_PUBLIC_BASE_URL}/admin/bank-transfers` :
  '管理画面から詳細を確認し、対応をお願いします。'}

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