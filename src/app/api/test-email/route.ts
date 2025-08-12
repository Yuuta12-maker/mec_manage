import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Gmail送信テスト
    const { sendApplicationEmailsWithGmail } = await import('@/lib/gmail');
    
    await sendApplicationEmailsWithGmail(
      email,
      'テストユーザー',
      'test-client-id'
    );

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Email sending failed'
    }, { status: 500 });
  }
}