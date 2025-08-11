'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                マインドエンジニアリング・コーチング
              </h1>
            </div>
            <div className="hidden md:flex space-x-6">
              <Link href="/service" className="text-gray-600 hover:text-gray-900">
                サービス詳細
              </Link>
              <Link href="/apply" className="text-gray-600 hover:text-gray-900">
                お申し込み
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                管理者ログイン
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            エンジニア思考で<br />
            人生をデザインする
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            論理的なアプローチで目標達成をサポートする<br />
            新しいコーチングサービス
          </p>
          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
            <Link
              href="/apply"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-50 transition-colors"
            >
              トライアルセッションを申し込む
            </Link>
            <Link
              href="/service"
              className="inline-block border-2 border-white text-white px-8 py-3 rounded-md font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              詳細を見る
            </Link>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            なぜマインドエンジニアリング・コーチングなのか
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">システマティックなアプローチ</h4>
              <p className="text-gray-600">
                エンジニアリング思考を応用し、論理的で再現性のある目標達成手法を提供します。
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">データドリブンな改善</h4>
              <p className="text-gray-600">
                進捗を数値化し、客観的なデータに基づいて継続的な改善を行います。
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">実践重視の継続サポート</h4>
              <p className="text-gray-600">
                具体的な行動計画の策定から実行まで、6ヶ月間の継続的なサポートを提供します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* プライシングセクション */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            料金プラン
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h4 className="text-2xl font-semibold text-gray-900 mb-4">トライアルセッション</h4>
              <div className="text-3xl font-bold text-blue-600 mb-6">
                ¥6,000<span className="text-lg text-gray-500">（税込）</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  30分のコーチングセッション
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  現状分析とゴール設定
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  継続プログラムのご提案
                </li>
              </ul>
              <Link
                href="/apply"
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
              >
                今すぐ申し込む
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-8 border-2 border-blue-500">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-2xl font-semibold text-gray-900">継続プログラム</h4>
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">おすすめ</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-6">
                ¥214,000<span className="text-lg text-gray-500">（税込）</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  6ヶ月間のコーチング
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  月1回×6回のセッション
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  継続的な進捗管理
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  メールサポート
                </li>
              </ul>
              <div className="text-sm text-gray-600 mb-4">
                ※トライアルセッション後にご案内
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">
            あなたの目標達成をサポートします
          </h3>
          <p className="text-xl mb-8 text-blue-100">
            まずはトライアルセッションで、マインドエンジニアリング・コーチングを体験してみませんか？
          </p>
          <Link
            href="/apply"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-gray-50 transition-colors"
          >
            今すぐ申し込む
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h5 className="font-semibold text-gray-900 mb-4">マインドエンジニアリング・コーチング</h5>
              <p className="text-gray-600 text-sm">
                エンジニアリング思考を応用した論理的で実践的なコーチングサービス
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-4">サービス</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/service" className="text-gray-600 hover:text-gray-900">サービス詳細</Link></li>
                <li><Link href="/apply" className="text-gray-600 hover:text-gray-900">お申し込み</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-4">法的情報</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legal" className="text-gray-600 hover:text-gray-900">特定商取引法に基づく表記</Link></li>
                <li><Link href="/privacy" className="text-gray-600 hover:text-gray-900">プライバシーポリシー</Link></li>
                <li><Link href="/terms" className="text-gray-600 hover:text-gray-900">利用規約</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2024 マインドエンジニアリング・コーチング. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}