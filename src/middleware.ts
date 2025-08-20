import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 管理者ページへのアクセス制御は各ページで個別に行う
  // ミドルウェアでは何もしない
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}