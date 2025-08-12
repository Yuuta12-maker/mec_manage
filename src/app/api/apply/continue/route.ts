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

    // 継続申し込みを作成
    const { data: application, error: insertError } = await supabaseAdmin
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

    console.log('Continuation application created:', application[0])

    // メール送信
    try {
      const emailResult = await sendContinuationApplicationEmailsWithGmail(
        client.email,
        client.name,
        application[0].id,
        program_type,
        '6回継続プログラム申し込み'
      )
      
      console.log('Email sending result:', emailResult)
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // メール送信失敗でも申し込みは成功とする
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