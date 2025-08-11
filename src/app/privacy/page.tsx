'use client'

export default function PrivacyPage() {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8">プライバシーポリシー</h2>
          
          <div className="space-y-8 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">1. 個人情報の取り扱いについて</h3>
              <p className="mb-2">
                マインドエンジニアリング・コーチング（以下、「当サービス」）では、
                お客様の個人情報を適切に管理し、以下の方針に基づいて取り扱います。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2. 収集する個人情報</h3>
              <p className="mb-2">当サービスでは、以下の個人情報を収集する場合があります：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>お名前、フリガナ</li>
                <li>メールアドレス</li>
                <li>電話番号</li>
                <li>住所</li>
                <li>生年月日</li>
                <li>性別</li>
                <li>コーチングセッションに関する情報</li>
                <li>決済に関する情報（クレジットカード情報は決済代行会社にて管理）</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3. 個人情報の利用目的</h3>
              <p className="mb-2">収集した個人情報は、以下の目的で利用いたします：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>コーチングサービスの提供</li>
                <li>セッションの予約・調整に関する連絡</li>
                <li>料金の請求・決済処理</li>
                <li>サービスの改善・向上</li>
                <li>重要なお知らせの配信</li>
                <li>お客様からのお問い合わせへの対応</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4. 個人情報の第三者提供</h3>
              <p className="mb-2">
                当サービスは、以下の場合を除き、お客様の同意なく第三者に個人情報を提供することはありません：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>決済処理のために必要な範囲で決済代行会社に提供する場合</li>
                <li>業務委託先に必要な範囲で提供する場合（適切な管理・監督を行います）</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5. 個人情報の管理</h3>
              <p className="mb-2">
                当サービスは、個人情報の漏洩、滅失、毀損の防止その他の安全管理のため、
                必要かつ適切な措置を講じます：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>SSL暗号化通信による情報送信</li>
                <li>アクセス権限の適切な管理</li>
                <li>定期的なセキュリティ監査の実施</li>
                <li>従業員への個人情報保護教育の徹底</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6. 決済情報の取り扱い</h3>
              <p className="mb-2">
                クレジットカード情報等の決済情報は、決済代行会社（Stripe）にて適切に管理されます。
                当サービスでは、決済完了情報のみを保存し、カード番号等の機密情報は保存いたしません。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Cookieの使用について</h3>
              <p className="mb-2">
                当サービスでは、サービス向上のためにCookieを使用する場合があります。
                Cookieを無効にされても基本的なサービスをご利用いただけますが、
                一部機能が制限される場合があります。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">8. 個人情報の開示・訂正・削除</h3>
              <p className="mb-2">
                お客様は、ご自身の個人情報について、以下の権利を有します：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>個人情報の開示を求める権利</li>
                <li>個人情報の訂正・追加・削除を求める権利</li>
                <li>個人情報の利用停止・消去を求める権利</li>
              </ul>
              <p className="mt-2">
                これらのご要望については、本人確認の上、適切に対応いたします。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">9. お問い合わせ窓口</h3>
              <p className="mb-2">
                個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください：
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-semibold">マインドエンジニアリング・コーチング</p>
                <p>担当者：森山雄太</p>
                <p>所在地：〒790-0012 愛媛県松山市湊町2-5-2 リコオビル401</p>
                <p>電話番号：090-5710-7627</p>
                <p>メールアドレス：mindengineeringcoaching@gmail.com</p>
                <p>受付時間：平日 9:00-18:00</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">10. プライバシーポリシーの変更</h3>
              <p className="mb-2">
                当プライバシーポリシーは、法令の変更やサービス内容の変更に伴い、
                予告なく変更する場合があります。変更後のプライバシーポリシーは、
                本ページに掲載した時点で効力を生じるものとします。
              </p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                制定日：2024年8月11日<br />
                最終更新日：2024年8月11日
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">
              マインドエンジニアリング・コーチング管理システム
            </p>
            <div className="flex space-x-4 text-sm">
              <a href="/legal" className="text-gray-600 hover:text-gray-900">特定商取引法</a>
              <a href="/service" className="text-gray-600 hover:text-gray-900">サービス詳細</a>
              <a href="/terms" className="text-gray-600 hover:text-gray-900">利用規約</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}