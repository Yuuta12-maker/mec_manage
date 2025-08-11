'use client'

export default function TermsPage() {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-8">利用規約</h2>
          
          <div className="space-y-8 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第1条（適用）</h3>
              <p>
                本利用規約（以下、「本規約」）は、マインドエンジニアリング・コーチング
                （以下、「当サービス」）が提供するコーチングサービスの利用条件を定めるものです。
                お客様（以下、「利用者」）は、本規約に同意したうえで当サービスをご利用ください。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第2条（サービス内容）</h3>
              <p className="mb-2">当サービスは、以下のサービスを提供します：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>マインドエンジニアリング・コーチングセッション</li>
                <li>目標設定および達成に向けたサポート</li>
                <li>進捗管理および継続的なフォローアップ</li>
                <li>その他、当サービスが提供するコーチング関連サービス</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第3条（利用登録）</h3>
              <p className="mb-2">
                利用者は、所定の申し込み手続きを完了することで、当サービスの利用登録を行うことができます。
                登録にあたっては、正確かつ最新の情報を提供する必要があります。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第4条（料金および支払い）</h3>
              <p className="mb-2">当サービスの料金は以下のとおりです：</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li>トライアルセッション：6,000円（税込）</li>
                <li>継続プログラム（6ヶ月間）：214,000円（税込）</li>
              </ul>
              <p className="mb-2">支払い方法：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>クレジットカード決済</li>
                <li>銀行振込</li>
              </ul>
              <p className="mt-3">
                料金は事前払いとし、利用者は指定された期日までに支払いを完了する必要があります。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第5条（キャンセル・返金）</h3>
              <div className="space-y-3">
                <p><strong>トライアルセッション：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>セッション実施前：キャンセル可能（全額返金）</li>
                  <li>セッション開始後：返金不可</li>
                </ul>
                <p><strong>継続プログラム：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li style={{color: '#c50502'}} className="font-semibold">返金不可</li>
                  <li>当サービス都合による中止：全額返金いたします</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第6条（セッションの実施）</h3>
              <p className="mb-2">
                セッションは、事前に双方で合意した日時・方法（オンラインまたは対面）で実施します。
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>遅刻や欠席の場合は、事前に連絡をお願いします</li>
                <li>利用者都合による無断欠席の場合、セッション料金は返金されません</li>
                <li>日程変更は、原則として48時間前までにご連絡ください</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第7条（禁止事項）</h3>
              <p className="mb-2">利用者は、以下の行為を行ってはなりません：</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>虚偽の情報を提供すること</li>
                <li>第三者の権利を侵害する行為</li>
                <li>公序良俗に反する行為</li>
                <li>当サービスの運営を妨害する行為</li>
                <li>その他、当サービスが不適切と判断する行為</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第8条（守秘義務）</h3>
              <p>
                当サービスは、セッション中に知り得た利用者の個人情報および秘密情報について、
                厳重に管理し、第三者に開示または漏洩しないものとします。
                同様に、利用者も当サービスの機密情報を第三者に開示してはなりません。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第9条（免責事項）</h3>
              <p className="mb-2">
                当サービスは、以下について責任を負いません：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>利用者の期待する効果が得られなかった場合</li>
                <li>技術的な問題によりサービス提供が困難となった場合</li>
                <li>天災、その他不可抗力によりサービス提供ができない場合</li>
                <li>利用者の行為により生じた損害</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第10条（サービスの変更・終了）</h3>
              <p>
                当サービスは、事前の通知により、サービス内容の変更または終了を行うことができます。
                サービス終了の場合、未実施分の料金については適切に返金いたします。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第11条（利用契約の解除）</h3>
              <p className="mb-2">
                当サービスは、利用者が以下に該当する場合、利用契約を解除することができます：
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>本規約に違反した場合</li>
                <li>料金の支払いを怠った場合</li>
                <li>その他、契約の継続が困難と判断される場合</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第12条（個人情報の取り扱い）</h3>
              <p>
                個人情報の取り扱いについては、別途定めるプライバシーポリシーに従います。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第13条（準拠法・管轄裁判所）</h3>
              <p>
                本規約は日本法に準拠し、本規約に関する紛争については、
                東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第14条（規約の変更）</h3>
              <p>
                当サービスは、必要に応じて本規約を変更することができます。
                変更後の規約は、本ページに掲載した時点で効力を生じるものとします。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">第15条（お問い合わせ）</h3>
              <p className="mb-2">
                本規約に関するお問い合わせは、以下までご連絡ください：
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
              <a href="/privacy" className="text-gray-600 hover:text-gray-900">プライバシーポリシー</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}