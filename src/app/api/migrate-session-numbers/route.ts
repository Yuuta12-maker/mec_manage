import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting session number migration ===')
    
    // 1. session_numberフィールドがまだ存在しない場合のチェック
    // （実際の環境ではSupabase管理画面でALTER TABLEを実行する必要があります）
    
    // 2. 既存セッションの番号を更新
    const { data: sessions, error: fetchError } = await supabase
      .from('sessions')
      .select('id, client_id, scheduled_date, created_at')
      .order('client_id')
      .order('scheduled_date')
      .order('created_at')
    
    if (fetchError) {
      console.error('Error fetching sessions:', fetchError)
      return NextResponse.json({ success: false, error: fetchError.message })
    }
    
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ success: true, message: 'No sessions to migrate' })
    }
    
    // クライアントごとにセッション番号を割り当て
    const clientSessions: {[key: string]: any[]} = {}
    
    sessions.forEach(session => {
      if (!clientSessions[session.client_id]) {
        clientSessions[session.client_id] = []
      }
      clientSessions[session.client_id].push(session)
    })
    
    // 各クライアントのセッションを更新
    let totalUpdated = 0
    
    for (const [clientId, clientSessionList] of Object.entries(clientSessions)) {
      for (let i = 0; i < clientSessionList.length; i++) {
        const session = clientSessionList[i]
        const sessionNumber = i + 1
        
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ session_number: sessionNumber })
          .eq('id', session.id)
        
        if (updateError) {
          console.error(`Error updating session ${session.id}:`, updateError)
        } else {
          totalUpdated++
          console.log(`Updated session ${session.id} for client ${clientId} to session number ${sessionNumber}`)
        }
      }
    }
    
    console.log(`=== Migration completed: ${totalUpdated} sessions updated ===`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Migration completed successfully. Updated ${totalUpdated} sessions.`,
      totalUpdated 
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}