'use client'

import Link from 'next/link'

export default function ApplySuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            マインドエンジニアリング・コーチング
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          {/* 成功アイコン */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            申し込みを受け付けました
          </h2>

          <div className="text-gray-600 space-y-4 mb-8">
            <p className="text-lg">
              この度は、マインドエンジニアリング・コーチングプログラムにお申し込みいただき、
              ありがとうございます。
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">今後の流れ</h3>
              <ol className="text-blue-800 space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                  <span>返信メールをご確認ください</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                  <span>トライアルセッションの日程調整を行います</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                  <span>トライアルセッション実施（30分程度）</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                  <span>継続プログラムについてのご相談</span>
                </li>
              </ol>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-yellow-900 mb-2">重要なお知らせ</h3>
              <ul className="text-yellow-800 space-y-1 text-sm">
                <li>• ご登録いただいたメールアドレスに確認メールをお送りしました</li>
                <li>• 迷惑メールフォルダもご確認ください</li>
                <li>• メールに記載された今後の流れをご確認ください</li>
              </ul>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              申し込み番号は自動で生成され、管理者が確認いたします。
              <br />
              何かご質問がございましたら、返信メールに記載された連絡先にお問い合わせください。
            </p>
          </div>

        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-500">
            マインドエンジニアリング・コーチング管理システム
          </p>
        </div>
      </footer>
    </div>
  )
}