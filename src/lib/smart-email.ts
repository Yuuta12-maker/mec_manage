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
  console.log('Subject:', subject)
  console.log('Type:', type)
  console.log('Related ID:', related_id)
  
  // キャリアメール判定
  const isCarrierEmail = to.includes('@docomo.ne.jp') || to.includes('@ezweb.ne.jp') || 
                        to.includes('@softbank.ne.jp') || to.includes('@au.com')
  
  console.log('Is carrier email:', isCarrierEmail)
  console.log('Content length:', content.length)
  
  // 1. キャリアメールの場合はResendを優先
  if (isCarrierEmail) {
    console.log('Trying Resend for carrier email...')
    try {
      const resendResult = await sendEmail({ to, subject, content, type, related_id })
      console.log('Resend result:', resendResult)
      
      if (resendResult.success) {
        console.log('✅ Resend successful for carrier email')
        return resendResult
      }
      
      console.log('❌ Resend failed, trying Gmail SMTP...')
    } catch (error) {
      console.log('❌ Resend threw error:', error)
    }
    
    try {
      const gmailResult = await sendEmailWithGmail({ to, subject, content, type, related_id })
      console.log('Gmail fallback result:', gmailResult)
      
      return {
        success: gmailResult.success,
        primary_method: 'resend',
        fallback_method: 'gmail',
        primary_result: { success: false, error: 'Resend failed' },
        fallback_result: gmailResult,
        final_success: gmailResult.success
      }
    } catch (error) {
      console.log('❌ Gmail fallback also failed:', error)
      return {
        success: false,
        primary_method: 'resend',
        fallback_method: 'gmail',
        primary_result: { success: false, error: 'Resend failed' },
        fallback_result: { success: false, error: error instanceof Error ? error.message : 'Gmail error' },
        final_success: false
      }
    }
  }
  
  // 2. その他のメールはGmail優先
  console.log('Trying Gmail SMTP for regular email...')
  try {
    const gmailResult = await sendEmailWithGmail({ to, subject, content, type, related_id })
    console.log('Gmail result:', gmailResult)
    
    if (gmailResult.success) {
      console.log('✅ Gmail SMTP successful')
      return gmailResult
    }
    
    console.log('❌ Gmail failed, trying Resend as fallback...')
  } catch (error) {
    console.log('❌ Gmail threw error:', error)
  }
  
  try {
    const resendResult = await sendEmail({ to, subject, content, type, related_id })
    console.log('Resend fallback result:', resendResult)
    
    return {
      success: resendResult.success,
      primary_method: 'gmail',
      fallback_method: 'resend',
      primary_result: { success: false, error: 'Gmail failed' },
      fallback_result: resendResult,
      final_success: resendResult.success
    }
  } catch (error) {
    console.log('❌ Resend fallback also failed:', error)
    return {
      success: false,
      primary_method: 'gmail',
      fallback_method: 'resend',
      primary_result: { success: false, error: 'Gmail failed' },
      fallback_result: { success: false, error: error instanceof Error ? error.message : 'Resend error' },
      final_success: false
    }
  }
}