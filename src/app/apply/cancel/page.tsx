'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApplyCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams?.get('client_id');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/apply');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            決済がキャンセルされました
          </h2>
          
          <div className="text-gray-600 space-y-3 mb-8">
            <p>
              トライアルセッションの決済処理がキャンセルされました。
            </p>
            <p>
              申し込み情報は保存されていますので、もう一度決済を試すことができます。
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
            <h3 className="text-sm font-medium text-blue-900 mb-2">次のステップ</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• もう一度クレジットカード決済を試すことができます</li>
              <li>• 銀行振込での申し込みに変更することもできます</li>
              <li>• ご質問があれば、お気軽にお問い合わせください</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <Link
              href="/apply"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              再度申し込む
            </Link>
            
            <div className="text-sm text-gray-500">
              {countdown > 0 && (
                <p>
                  {countdown}秒後に自動的に申し込み画面に戻ります
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            ご質問がございましたら、
            <a href="mailto:mindengineeringcoaching@gmail.com" className="text-blue-600 hover:underline ml-1">
              こちら
            </a>
            までお問い合わせください。
          </p>
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
  );
}