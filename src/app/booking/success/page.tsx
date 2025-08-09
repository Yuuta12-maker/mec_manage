'use client'

import Link from 'next/link'

export default function BookingSuccessPage() {
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
            セッション予約を受け付けました
          </h2>

          <div className="text-gray-600 space-y-4 mb-8">
            <p className="text-lg">
              セッションのご予約ありがとうございます。
              <br />
              ご予約内容を確認の上、担当者よりご連絡いたします。
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">予約確定までの流れ</h3>
              <ol className="text-blue-800 space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                  <span>返信メールをご確認ください</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                  <span>セッション当日の詳細案内が記載されています</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                  <span>準備事項もメールに記載しております</span>
                </li>
              </ol>
            </div>


            <div className="bg-yellow-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-yellow-900 mb-2">キャンセル・変更について</h3>
              <ul className="text-yellow-800 space-y-1 text-sm">
                <li>• キャンセルはできるだけ早く行っていただければ、可能な限り対応いたします</li>
                <li>• キャンセル料はかかりません</li>
                <li>• 変更・キャンセルのご連絡は返信メールに記載の連絡先までお願いいたします</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">ご準備いただくもの（オンラインセッション）</h3>
              <ul className="text-gray-700 space-y-1 text-sm">
                <li>• インターネット接続環境</li>
                <li>• カメラ・マイク機能のあるPC・スマートフォン・タブレット</li>
                <li>• 静かで集中できる環境</li>
                <li>• 筆記用具（メモを取りたい場合）</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-left mt-6">
              <h3 className="font-semibold text-green-900 mb-2">重要なお知らせ</h3>
              <ul className="text-green-800 space-y-1 text-sm">
                <li>• <strong>返信メールを必ずご確認ください</strong></li>
                <li>• セッション詳細・準備事項・連絡先が記載されています</li>
                <li>• メールが届かない場合は迷惑メールフォルダもご確認ください</li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              ご不明な点がございましたら、返信メールに記載の連絡先までお気軽にお問い合わせください。
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