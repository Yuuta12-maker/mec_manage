'use client'

export default function ServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            マインドエンジニアリング・コーチング
          </h1>
          <p className="mt-2 text-lg text-gray-600 text-center">
            サービス詳細
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4">
        {/* サービス概要 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">サービス概要</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            マインドエンジニアリング・コーチングは、エンジニアリング思考を応用した革新的なコーチングサービスです。
            システム設計やプログラミングのアプローチを人生設計に活用し、論理的かつ実践的な目標達成をサポートします。
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">論理的思考</h3>
              <p className="text-sm text-gray-600">エンジニアリング思考を活用した体系的アプローチ</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">実践重視</h3>
              <p className="text-sm text-gray-600">具体的な行動計画と継続的な実行サポート</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">成果測定</h3>
              <p className="text-sm text-gray-600">データに基づく進捗管理と成果の可視化</p>
            </div>
          </div>
        </div>

        {/* プログラム内容 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">プログラム内容</h2>
          
          <div className="space-y-8">
            {/* トライアルセッション */}
            <div className="border-l-4 border-blue-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">トライアルセッション</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">期間</p>
                  <p className="text-gray-600">30分</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">料金</p>
                  <p className="text-gray-600">6,000円（税込）</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                現在の課題や目標をヒアリングし、マインドエンジニアリング・コーチングの手法を体験していただきます。
                プログラムとの適合性を確認し、継続的なサポートプランをご提案いたします。
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>現状分析とゴール設定</li>
                <li>コーチング手法の体験</li>
                <li>継続プログラムのご説明</li>
              </ul>
            </div>

            {/* 継続プログラム */}
            <div className="border-l-4 border-green-500 pl-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">継続プログラム</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">期間</p>
                  <p className="text-gray-600">6ヶ月間</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">回数</p>
                  <p className="text-gray-600">月1回×6回</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">料金</p>
                  <p className="text-gray-600">214,000円（税込）</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                体系的なコーチングプログラムを通じて、持続可能な成長とゴール達成をサポートします。
                各セッションでは進捗確認、課題解決、次のアクションプランの策定を行います。
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">月次セッション内容</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>前月の振り返りと成果確認</li>
                    <li>課題の分析と解決策の検討</li>
                    <li>次月のアクションプラン策定</li>
                    <li>モチベーション維持のサポート</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">継続サポート</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>メールでの質問対応</li>
                    <li>進捗管理ツールの提供</li>
                    <li>リソースや資料の共有</li>
                    <li>緊急時の追加サポート</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 対象者・効果 */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">こんな方におすすめ</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                目標達成に論理的なアプローチを求める方
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                エンジニアやIT関連職の方
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                システマティックな成長を望む方
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                データに基づく改善を重視する方
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                継続的な学習と成長を大切にする方
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">期待できる効果</h2>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">●</span>
                明確な目標設定と達成計画の構築
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">●</span>
                論理的思考力の向上
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">●</span>
                継続的な行動習慣の確立
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">●</span>
                問題解決能力の強化
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">●</span>
                自己管理スキルの向上
              </li>
            </ul>
          </div>
        </div>

        {/* コーチプロフィール */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">コーチプロフィール</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">森山雄太（もりやま ゆうた）</h3>
              <p className="text-gray-700 mb-4">
                ソフトウェアエンジニアとして10年以上の経験を持ち、システム設計からプロジェクト管理まで幅広く従事。
                エンジニアリング手法をコーチングに応用した独自のメソッドを開発し、多くのクライアントの目標達成をサポート。
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>経歴：</strong> 大手IT企業でシニアエンジニア、プロジェクトリーダーを歴任</p>
                <p><strong>専門：</strong> システム思考、アジャイル開発、プロダクト管理</p>
                <p><strong>資格：</strong> 認定プロフェッショナルコーチ（予定）</p>
              </div>
            </div>
          </div>
        </div>

        {/* 申し込み案内 */}
        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">お申し込み</h2>
          <p className="text-gray-700 mb-6">
            まずはトライアルセッションから始めませんか？<br />
            あなたの目標達成をサポートいたします。
          </p>
          <a 
            href="/apply" 
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            申し込みフォームへ
          </a>
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
              <a href="/privacy" className="text-gray-600 hover:text-gray-900">プライバシーポリシー</a>
              <a href="/terms" className="text-gray-600 hover:text-gray-900">利用規約</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}