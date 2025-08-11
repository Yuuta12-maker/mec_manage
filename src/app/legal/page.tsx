'use client'

export default function LegalPage() {
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
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">特定商取引法に基づく表記</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">販売者</h3>
              <p className="text-gray-700">森山雄太</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">所在地</h3>
              <p className="text-gray-700">
                〒150-0002<br />
                東京都渋谷区渋谷1-1-1
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">連絡先</h3>
              <p className="text-gray-700">
                電話番号：03-1234-5678<br />
                メールアドレス：mindengineeringcoaching@gmail.com<br />
                受付時間：平日 9:00-18:00
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">販売価格</h3>
              <div className="text-gray-700">
                <p className="mb-2">トライアルセッション：6,000円（税込）</p>
                <p className="mb-2">継続プログラム（6ヶ月間）：214,000円（税込）</p>
                <p className="font-semibold">総額：220,000円（税込）</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">商品の引渡時期</h3>
              <div className="text-gray-700">
                <p className="mb-2">• トライアルセッション：決済完了後、担当者よりご連絡し日程調整いたします</p>
                <p>• 継続プログラム：トライアルセッション後、契約成立次第開始いたします</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">お支払い方法</h3>
              <div className="text-gray-700">
                <p className="mb-2">• クレジットカード決済（VISA、Mastercard、American Express、JCB）</p>
                <p>• 銀行振込</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">返品・キャンセルについて</h3>
              <div className="text-gray-700">
                <p className="mb-2">サービスの性質上、以下のとおり取り扱います：</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>トライアルセッション実施前：キャンセル可能（全額返金）</li>
                  <li>トライアルセッション実施後：継続プログラムへの参加義務はありません</li>
                  <li>継続プログラム開始後：原則として返金不可</li>
                  <li>サービス提供者の都合による中止：全額返金いたします</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">その他</h3>
              <div className="text-gray-700">
                <p className="mb-2">本サービスは個人向けコーチングサービスです。</p>
                <p className="mb-2">セッションはオンライン（Google Meet）または対面で実施いたします。</p>
                <p>詳細については、お申し込み前にお気軽にお問い合わせください。</p>
              </div>
            </div>
          </div>
        </div>
      </main>

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