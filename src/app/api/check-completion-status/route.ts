import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== 一括完了ステータスチェック開始 ===')
    
    // activeステータスのクライアントを全て取得
    const { data: activeClients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, status')
      .eq('status', 'active')

    if (clientError) {
      console.error('クライアント取得エラー:', clientError)
      return NextResponse.json({ 
        success: false, 
        error: 'クライアント情報の取得に失敗しました' 
      }, { status: 500 })
    }

    if (!activeClients || activeClients.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'activeステータスのクライアントはいません',
        updated: []
      })
    }

    console.log(`${activeClients.length}人のactiveクライアントをチェック中...`)

    const updatedClients: Array<{id: string, name: string, sessionCount: number}> = []

    // 各activeクライアントの完了セッション数をチェック
    for (const client of activeClients) {
      const { data: completedSessions, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('client_id', client.id)
        .eq('status', 'completed')

      if (sessionError) {
        console.error(`クライアント ${client.name} のセッション取得エラー:`, sessionError)
        continue
      }

      const sessionCount = completedSessions?.length || 0
      console.log(`${client.name}: ${sessionCount}回完了`)

      // 6回以上完了の場合、ステータスを更新
      if (sessionCount >= 6) {
        const { error: updateError } = await supabase
          .from('clients')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', client.id)

        if (updateError) {
          console.error(`クライアント ${client.name} のステータス更新エラー:`, updateError)
        } else {
          console.log(`✅ ${client.name} のステータスをcompletedに更新しました`)
          updatedClients.push({
            id: client.id,
            name: client.name,
            sessionCount: sessionCount
          })
        }
      }
    }

    console.log('=== 一括完了ステータスチェック完了 ===')
    console.log(`更新されたクライアント数: ${updatedClients.length}`)

    return NextResponse.json({ 
      success: true, 
      message: `${updatedClients.length}人のクライアントステータスを更新しました`,
      updated: updatedClients,
      totalChecked: activeClients.length
    })

  } catch (error) {
    console.error('一括完了ステータスチェックエラー:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'システムエラーが発生しました' 
    }, { status: 500 })
  }
}