import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 環境変数が未設定の場合はエラーをスローする
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数の設定状況:', {
    url: supabaseUrl ? '設定済み' : '未設定',
    key: supabaseAnonKey ? '設定済み' : '未設定'
  })
  throw new Error('Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを設定してください。')
}

// プレースホルダー値をチェック
if (supabaseUrl.includes('your_supabase') || supabaseAnonKey.includes('your_supabase')) {
  throw new Error('Supabase環境変数にプレースホルダー値が設定されています。実際の値を設定してください。')
}

// URLの妥当性をチェック
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error('無効なSupabase URLです。')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)