import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendApplicationEmailsWithGmail } from '@/lib/gmail';

interface ApplyRequest {
  name: string;
  name_kana: string;
  email: string;
  gender: string;
  birth_date: string;
  phone: string;
  address: string;
  preferred_session_format: 'face-to-face' | 'online';
  notes?: string;
  payment_method: 'card' | 'bank_transfer';
}

export async function POST(request: NextRequest) {
  try {
    const body: ApplyRequest = await request.json();

    // バリデーション
    const requiredFields = ['name', 'name_kana', 'email', 'phone', 'gender', 'birth_date', 'address'];
    for (const field of requiredFields) {
      if (!body[field as keyof ApplyRequest]?.toString().trim()) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // メールアドレス重複チェック
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('email')
      .eq('email', body.email.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking email:', checkError);
      return NextResponse.json(
        { success: false, error: 'Email validation failed' },
        { status: 500 }
      );
    }

    if (existingClient) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // クライアント情報を保存
    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        name: body.name.trim(),
        name_kana: body.name_kana.trim(),
        email: body.email.trim(),
        gender: body.gender,
        birth_date: body.birth_date,
        phone: body.phone.trim(),
        address: body.address.trim(),
        preferred_session_format: body.preferred_session_format,
        notes: body.notes?.trim() || null,
        status: 'applied',
        trial_payment_status: 'pending',
        trial_payment_amount: 6000,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting client:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save application' },
        { status: 500 }
      );
    }

    // カード決済の場合はここで終了（フロントエンドでStripe決済に進む）
    if (body.payment_method === 'card') {
      return NextResponse.json({
        success: true,
        clientId: client.id,
        requiresPayment: true,
        message: 'Application saved, proceed to payment'
      });
    }

    // 銀行振込の場合は従来通りメール送信
    try {
      await sendApplicationEmailsWithGmail(
        client.email,
        client.name,
        client.id
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // メール送信失敗でも申し込みは有効とする
    }

    return NextResponse.json({
      success: true,
      clientId: client.id,
      requiresPayment: false,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Apply error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}