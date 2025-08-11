'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ApplySuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (sessionId) {
      verifyPayment()
    } else {
      setPaymentStatus('success') // 通常の申し込み完了
    }
  }, [sessionId])

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/stripe/verify-payment?session_id=${sessionId}`)
      const data = await response.json()
      
      setPaymentStatus(data.success ? 'success' : 'error')
    } catch (error) {
      console.error('Payment verification error:', error)
      setPaymentStatus('error')
    }
  }

  if (sessionId && paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">決済確認中...</p>
        </div>
      </div>
    )
  }

  if (sessionId && paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              マインドエンジニアリング・コーチング
            </h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-12 px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              決済の確認ができませんでした
            </h2>
            
            <div className="text-gray-600 space-y-3 mb-8">
              <p>
                決済に失敗したか、確認中にエラーが発生しました。
              </p>
              <p>
                お手数ですが、もう一度お試しいただくか、お問い合わせください。
              </p>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                <a 
                  href="mailto:mindengineeringcoaching@gmail.com" 
                  className="text-blue-600 hover:underline"
                >
                  mindengineeringcoaching@gmail.com
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

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
            {sessionId ? 'トライアルセッション決済完了！' : '申し込みを受け付けました'}
          </h2>

          <div className="text-gray-600 space-y-4 mb-8">
            <p className="text-lg">
              {sessionId 
                ? 'MECトライアルセッションの決済が正常に完了しました。'
                : 'この度は、マインドエンジニアリング・コーチングプログラムにお申し込みいただき、ありがとうございます。'
              }
            </p>

            {sessionId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">
                    決済が正常に処理されました
                  </span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  金額: ¥6,000（税込）
                </p>
              </div>
            )}
            
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">今後の流れ</h3>
              <ol className="text-blue-800 space-y-2 text-sm">
                {sessionId ? (
                  <>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                      <span>決済完了の確認メール送信</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                      <span>トライアルセッション日程のご連絡（近日中）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                      <span>トライアルセッション実施（30分程度）</span>
                    </li>
                    <li className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                      <span>継続プログラムのご案内</span>
                    </li>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </ol>
            </div>

            {!sessionId && (
              <div className="bg-yellow-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-yellow-900 mb-2">重要なお知らせ</h3>
                <ul className="text-yellow-800 space-y-1 text-sm">
                  <li>• ご登録いただいたメールアドレスに確認メールをお送りしました</li>
                  <li>• 迷惑メールフォルダもご確認ください</li>
                  <li>• メールに記載された今後の流れをご確認ください</li>
                </ul>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-6">
              {sessionId 
                ? 'ご不明な点がございましたら、お気軽にお問い合わせください。'
                : '申し込み番号は自動で生成され、管理者が確認いたします。何かご質問がございましたら、返信メールに記載された連絡先にお問い合わせください。'
              }
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