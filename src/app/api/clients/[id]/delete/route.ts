import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// サーバーサイド用のSupabaseクライアント（RLS回避）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase URL:', supabaseUrl)
console.log('Using service key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    console.log('DELETE request received for client ID:', clientId)

    if (!clientId) {
      console.log('No client ID provided')
      return NextResponse.json(
        { error: 'クライアントIDが指定されていません' },
        { status: 400 }
      )
    }

    // まずクライアントが存在するかチェック
    console.log('Checking if client exists:', clientId)
    const { data: existingClient, error: clientCheckError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .single()

    console.log('Client check result:', { existingClient, clientCheckError })

    if (clientCheckError || !existingClient) {
      console.log('Client not found or error:', clientCheckError)
      return NextResponse.json(
        { error: 'クライアントが見つかりません', details: clientCheckError?.message },
        { status: 404 }
      )
    }

    // トランザクション的に削除を実行
    // 1. 関連データの確認と削除

    // メール履歴を削除
    const { error: emailHistoryError } = await supabase
      .from('email_history')
      .delete()
      .eq('client_id', clientId)

    if (emailHistoryError) {
      console.error('Error deleting email history:', emailHistoryError)
      return NextResponse.json(
        { error: 'メール履歴の削除に失敗しました' },
        { status: 500 }
      )
    }

    // 継続申し込み情報を削除
    const { error: continuationError } = await supabase
      .from('continuation_applications')
      .delete()
      .eq('client_id', clientId)

    if (continuationError) {
      console.error('Error deleting continuation applications:', continuationError)
      return NextResponse.json(
        { error: '継続申し込み情報の削除に失敗しました' },
        { status: 500 }
      )
    }

    // 支払い情報を削除
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('client_id', clientId)

    if (paymentsError) {
      console.error('Error deleting payments:', paymentsError)
      return NextResponse.json(
        { error: '支払い情報の削除に失敗しました' },
        { status: 500 }
      )
    }

    // セッション関連のメール履歴を削除（セッション削除前）
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('client_id', clientId)

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id)
      
      const { error: sessionEmailError } = await supabase
        .from('email_history')
        .delete()
        .in('session_id', sessionIds)

      if (sessionEmailError) {
        console.error('Error deleting session email history:', sessionEmailError)
        return NextResponse.json(
          { error: 'セッション関連メール履歴の削除に失敗しました' },
          { status: 500 }
        )
      }
    }

    // セッションを削除
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('client_id', clientId)

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError)
      return NextResponse.json(
        { error: 'セッション情報の削除に失敗しました' },
        { status: 500 }
      )
    }

    // 最後にクライアント本体を削除
    const { error: clientDeleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    if (clientDeleteError) {
      console.error('Error deleting client:', clientDeleteError)
      return NextResponse.json(
        { error: 'クライアント情報の削除に失敗しました' },
        { status: 500 }
      )
    }

    // 削除ログを記録（email_logsテーブルを利用）
    try {
      await supabase
        .from('email_logs')
        .insert({
          recipient: 'system@admin',
          subject: `クライアント削除ログ: ${existingClient.name}`,
          content: `クライアント「${existingClient.name}」(ID: ${clientId})が完全に削除されました。削除日時: ${new Date().toISOString()}`,
          type: 'session_update',
          related_id: clientId,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
    } catch (logError) {
      console.warn('Failed to log deletion:', logError)
      // ログ記録失敗は致命的ではないので処理を続行
    }

    return NextResponse.json(
      { 
        message: 'クライアントとすべての関連データが正常に削除されました',
        deletedClient: {
          id: clientId,
          name: existingClient.name
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error during client deletion:', error)
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    )
  }
}