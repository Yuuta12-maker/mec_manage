import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    // system_activity_log テーブルは既にマイグレーションで作成済み

    // アクティビティログを記録
    const { data: logData, error: logError } = await supabaseAdmin
      .from('system_activity_log')
      .insert({
        activity_type: 'keep_alive',
        message: 'Automated keep-alive ping to maintain database activity',
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'api_endpoint',
          user_agent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      })
      .select()

    if (logError) {
      console.error('Keep-alive log error:', logError)
    }

    // 古いログエントリを削除（過去30日より古いものを削除）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    await supabaseAdmin
      .from('system_activity_log')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())

    // 基本的なデータベース操作も実行
    const { data: clientCount } = await supabaseAdmin
      .from('clients')
      .select('id', { count: 'exact' })

    const { data: sessionCount } = await supabaseAdmin
      .from('sessions')
      .select('id', { count: 'exact' })

    const { data: recentActivity } = await supabaseAdmin
      .from('system_activity_log')
      .select('created_at')
      .eq('activity_type', 'keep_alive')
      .order('created_at', { ascending: false })
      .limit(5)

    return NextResponse.json({
      success: true,
      message: 'Keep-alive ping successful',
      timestamp: new Date().toISOString(),
      statistics: {
        clients: clientCount?.length || 0,
        sessions: sessionCount?.length || 0,
        recent_pings: recentActivity?.length || 0
      },
      last_pings: recentActivity?.map(activity => activity.created_at) || []
    })

  } catch (error) {
    console.error('Keep-alive error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}