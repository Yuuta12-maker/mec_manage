'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ContinueApplicationSuccessPage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white shadow-lg rounded-lg px-8 py-12 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              決済の確認ができませんでした
            </h1>
            
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
                  className="text-primary hover:underline"
                >
                  mindengineeringcoaching@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white shadow-lg rounded-lg px-8 py-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {sessionId ? '決済が完了しました！' : '申し込みが完了しました！'}
          </h1>
          
          <div className="text-gray-600 space-y-3 mb-8">
            <p>
              {sessionId 
                ? 'MEC継続プログラムの決済が正常に完了し、お申し込みが承認されました。'
                : '継続プログラムへのお申し込み、誠にありがとうございます。'
              }
            </p>
            <p>
              {sessionId 
                ? '近日中に最初のセッション日程についてご連絡いたします。'
                : '2営業日以内に担当者よりご連絡いたします。'
              }
            </p>
          </div>

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
                金額: ¥50,000（税込）
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-blue-900 mb-2">今後の流れ</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              {sessionId ? (
                <>
                  <li>1. 決済完了の確認メール送信</li>
                  <li>2. セッション日程のご連絡（近日中）</li>
                  <li>3. プログラム詳細資料のお送り</li>
                  <li>4. 継続セッション開始</li>
                </>
              ) : (
                <>
                  <li>1. 担当者からのご連絡（2営業日以内）</li>
                  <li>2. プログラム内容の詳細説明</li>
                  <li>3. スケジュール調整</li>
                  <li>4. 継続セッション開始</li>
                </>
              )}
            </ul>
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2">
              ご不明な点がございましたら、お気軽にお問い合わせください。
            </p>
            <p>
              <a 
                href="mailto:mindengineeringcoaching@gmail.com" 
                className="text-primary hover:underline"
              >
                mindengineeringcoaching@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}