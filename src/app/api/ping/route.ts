import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 認証不要の非常に簡単なピングエンドポイント
  return NextResponse.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    status: 'alive'
  })
}

export async function POST(request: NextRequest) {
  // POST版も作成（keep-alive用）
  return NextResponse.json({
    success: true,
    message: 'keep-alive pong',
    timestamp: new Date().toISOString(),
    status: 'alive',
    ping: 'received'
  })
}