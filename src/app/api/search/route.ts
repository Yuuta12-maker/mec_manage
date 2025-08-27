import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        success: true,
        results: {
          clients: [],
          sessions: []
        },
        totalResults: 0
      })
    }

    const searchTerm = query.trim()
    console.log('=== 全体検索実行 ===')
    console.log('検索キーワード:', searchTerm)

    // クライアント検索（名前、カナ、メールアドレス、備考で検索）
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,name_kana.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (clientError) {
      console.error('クライアント検索エラー:', clientError)
    }

    // セッション検索（メモ、要約、コーチ名で検索）+ クライアント情報も含む
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        client:clients(*)
      `)
      .or(`notes.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,coach_name.ilike.%${searchTerm}%`)
      .order('scheduled_date', { ascending: false })
      .limit(50)

    if (sessionError) {
      console.error('セッション検索エラー:', sessionError)
    }

    // クライアント名でもセッションを検索（間接検索）
    let clientNameSessions: any[] = []
    if (clients && clients.length > 0) {
      const clientIds = clients.map(c => c.id)
      const { data: relatedSessions, error: relatedError } = await supabase
        .from('sessions')
        .select(`
          *,
          client:clients(*)
        `)
        .in('client_id', clientIds)
        .order('scheduled_date', { ascending: false })
        .limit(30)

      if (!relatedError && relatedSessions) {
        clientNameSessions = relatedSessions
      }
    }

    // セッション結果を統合（重複除去）
    const allSessions = [...(sessions || []), ...clientNameSessions]
    const uniqueSessions = allSessions.filter((session, index, self) =>
      index === self.findIndex(s => s.id === session.id)
    )

    const totalResults = (clients?.length || 0) + uniqueSessions.length

    console.log(`検索結果: クライアント ${clients?.length || 0}件, セッション ${uniqueSessions.length}件`)

    return NextResponse.json({
      success: true,
      results: {
        clients: clients || [],
        sessions: uniqueSessions
      },
      totalResults,
      searchTerm
    })

  } catch (error) {
    console.error('検索エラー:', error)
    return NextResponse.json({
      success: false,
      error: '検索中にエラーが発生しました'
    }, { status: 500 })
  }
}