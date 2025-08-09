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
    console.log('Raw params received:', params)
    const clientId = params?.id
    console.log('DELETE request received for client ID:', clientId)
    console.log('Client ID type:', typeof clientId)
    console.log('Client ID length:', clientId?.length)

    if (!clientId) {
      console.log('No client ID provided')
      return NextResponse.json(
        { error: 'クライアントIDが指定されていません' },
        { status: 400 }
      )
    }

    // SQL関数を使用してクライアントを完全削除
    console.log('Calling delete function for client:', clientId)
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('delete_client_completely', { client_uuid: clientId })

    console.log('Delete function result:', deleteResult)
    console.log('Delete function error:', deleteError)

    if (deleteError) {
      console.error('Error calling delete function:', deleteError)
      return NextResponse.json(
        { error: '削除処理でエラーが発生しました', details: deleteError.message },
        { status: 500 }
      )
    }

    // 結果を確認
    if (!deleteResult || !deleteResult.success) {
      const errorMessage = deleteResult?.error || '削除に失敗しました'
      console.log('Delete function failed:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: deleteResult?.error === 'Client not found' ? 404 : 500 }
      )
    }

    // 削除ログを記録
    try {
      await supabase
        .from('email_logs')
        .insert({
          recipient: 'system@admin',
          subject: `クライアント削除ログ: ${deleteResult.deletedClient.name}`,
          content: `クライアント「${deleteResult.deletedClient.name}」(ID: ${clientId})が完全に削除されました。削除日時: ${new Date().toISOString()}`,
          type: 'session_update',
          related_id: clientId,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
    } catch (logError) {
      console.warn('Failed to log deletion:', logError)
    }

    return NextResponse.json(
      { 
        message: 'クライアントとすべての関連データが正常に削除されました',
        deletedClient: deleteResult.deletedClient
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