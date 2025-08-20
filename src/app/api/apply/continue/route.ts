import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendContinuationApplicationEmailsWithGmail } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      client_id,
      trial_session_id,
      program_type,
      preferred_start_date,
      payment_method,
      application_id,
    } = body

    console.log('=== API Route: Continue Application ===')
    console.log('Request body:', body)

    if (!client_id || !program_type || !payment_method) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // クライアント情報を取得
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      console.error('Error fetching client:', clientError)
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    let application: any[]

    if (application_id) {
      // 既存の申し込みを更新
      const { data: updatedApplication, error: updateError } = await supabaseAdmin
        .from('continuation_applications')
        .update({
          program_type,
          preferred_start_date: preferred_start_date || null,
          payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application_id)
        .select()

      if (updateError) {
        console.error('Error updating continuation application:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update application' },
          { status: 500 }
        )
      }
      application = updatedApplication
    } else {
      // 新規の継続申し込みを作成
      const { data: newApplication, error: insertError } = await supabaseAdmin
        .from('continuation_applications')
        .insert({
          client_id,
          trial_session_id: trial_session_id || null,
          program_type,
          preferred_start_date: preferred_start_date || null,
          payment_method,
          goals: '6回継続プログラム申し込み', // 固定値
          schedule_preference: null,
          special_requests: null,
          status: 'pending',
        })
        .select()

      if (insertError) {
        console.error('Error creating continuation application:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to create application' },
          { status: 500 }
        )
      }
      application = newApplication
    }

    console.log('Continuation application processed:', application[0])

    // 銀行振込の場合は bank_transfer_payments テーブルにレコードを作成
    if (payment_method === 'bank_transfer') {
      try {
        const transferDeadline = new Date()
        transferDeadline.setDate(transferDeadline.getDate() + 7) // 1週間後

        const { data: bankTransferData, error: bankTransferError } = await supabaseAdmin
          .from('bank_transfer_payments')
          .insert({
            continuation_application_id: application[0].id,
            client_id: client.id,
            payment_type: 'continuation',
            amount: 214000, // 継続プログラム料金
            due_date: transferDeadline.toISOString().split('T')[0],
            transfer_deadline: transferDeadline.toISOString().split('T')[0],
            status: 'pending'
          })
          .select()

        if (bankTransferError) {
          console.error('Error creating bank transfer payment:', bankTransferError)
          // エラーでも継続処理する
        } else {
          console.log('Bank transfer payment record created:', bankTransferData[0])
        }
      } catch (bankTransferCreateError) {
        console.error('Bank transfer payment creation failed:', bankTransferCreateError)
        // エラーでも継続処理する
      }
    }

    // メール送信（新規申し込みの場合のみ）
    if (!application_id) {
      try {
        const emailResult = await sendContinuationApplicationEmailsWithGmail(
          client.email,
          client.name,
          application[0].id,
          program_type,
          '6回継続プログラム申し込み',
          payment_method
        )
        
        console.log('Email sending result:', emailResult)
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // メール送信失敗でも申し込みは成功とする
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application[0].id,
        message: 'Application submitted successfully'
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