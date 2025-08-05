'use server'

import { sendEmailWithGmail } from './gmail'
import { sendEmail } from './email' // Resend

interface EmailData {
  to: string
  subject: string
  content: string
  type: 'application' | 'booking' | 'session_update'
  related_id?: string
}

export async function sendSmartEmail({ to, subject, content, type, related_id }: EmailData) {
  console.log('=== Smart Email System ===')
  console.log('Recipient:', to)
  
  // キャリアメール判定
  const isCarrierEmail = to.includes('@docomo.ne.jp') || to.includes('@ezweb.ne.jp') || 
                        to.includes('@softbank.ne.jp') || to.includes('@au.com')
  
  console.log('Is carrier email:', isCarrierEmail)
  
  // 1. キャリアメールの場合はResendを優先
  if (isCarrierEmail) {
    console.log('Trying Resend for carrier email...')
    const resendResult = await sendEmail({ to, subject, content, type, related_id })
    
    if (resendResult.success) {
      console.log('✅ Resend successful for carrier email')
      return resendResult
    }
    
    console.log('❌ Resend failed, trying Gmail SMTP...')
    const gmailResult = await sendEmailWithGmail({ to, subject, content, type, related_id })
    
    return {
      success: gmailResult.success,
      primary_method: 'resend',
      fallback_method: 'gmail',
      primary_result: resendResult,
      fallback_result: gmailResult,
      final_success: gmailResult.success
    }
  }
  
  // 2. その他のメールはGmail優先
  console.log('Trying Gmail SMTP for regular email...')
  const gmailResult = await sendEmailWithGmail({ to, subject, content, type, related_id })
  
  if (gmailResult.success) {
    console.log('✅ Gmail SMTP successful')
    return gmailResult
  }
  
  console.log('❌ Gmail failed, trying Resend as fallback...')
  const resendResult = await sendEmail({ to, subject, content, type, related_id })
  
  return {
    success: resendResult.success,
    primary_method: 'gmail',
    fallback_method: 'resend',
    primary_result: gmailResult,
    fallback_result: resendResult,
    final_success: resendResult.success
  }
}