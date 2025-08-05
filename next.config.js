/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercelでは output: 'standalone' は不要
  // output: 'standalone',
  
  // 環境変数をサーバーサイドで利用可能にする
  env: {
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
}

module.exports = nextConfig