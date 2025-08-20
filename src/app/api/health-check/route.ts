import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    // データベースの簡単なヘルスチェック
    const { data: healthCheck, error, count } = await supabaseAdmin
      .from('clients')
      .select('id', { count: 'exact' })
      .limit(1)

    if (error) {
      console.error('Health check error:', error)
      return NextResponse.json(
        { success: false, error: error.message, timestamp: new Date().toISOString() },
        { status: 500 }
      )
    }

    // システムログに記録（アクティビティの証明）
    const logEntry = {
      message: 'System health check performed',
      timestamp: new Date().toISOString(),
      type: 'health_check',
      status: 'success'
    }

    console.log('Health check log:', logEntry)

    return NextResponse.json({
      success: true,
      message: 'System is healthy',
      timestamp: new Date().toISOString(),
      database_status: 'connected',
      client_count: count || 0
    })
  } catch (error) {
    console.error('Health check failed:', error)
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