'use client'

export default function ContinueApplicationSuccessPage() {
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
            申し込みが完了しました！
          </h1>
          
          <div className="text-gray-600 space-y-3 mb-8">
            <p>
              継続プログラムへのお申し込み、誠にありがとうございます。
            </p>
            <p>
              2営業日以内に担当者よりご連絡いたします。
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-blue-900 mb-2">今後の流れ</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>1. 担当者からのご連絡（2営業日以内）</li>
              <li>2. プログラム内容の詳細説明</li>
              <li>3. スケジュール調整</li>
              <li>4. 継続セッション開始</li>
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