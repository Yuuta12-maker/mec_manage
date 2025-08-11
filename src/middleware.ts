import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 管理者ページへのアクセスをブロック
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 403 Forbidden を返す
    return new NextResponse('Forbidden', { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
}