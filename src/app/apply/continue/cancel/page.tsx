'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ContinueCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams?.get('application_id');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (applicationId) {
            router.push(`/apply/continue?application_id=${applicationId}`);
          } else {
            router.push('/');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [applicationId, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              決済がキャンセルされました
            </h1>
            
            <p className="text-gray-600 mb-6">
              決済処理がキャンセルされましたが、継続プログラムの申し込み情報は保存されています。
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-900 mb-2">次のステップ</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• もう一度決済を試すことができます</li>
                <li>• 別の支払い方法（銀行振込など）を選択できます</li>
                <li>• ご質問があれば、お気軽にお問い合わせください</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              {applicationId && (
                <Link
                  href={`/apply/continue?application_id=${applicationId}`}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  再度決済を試す
                </Link>
              )}
              
              <div className="text-sm text-gray-500">
                {countdown > 0 && (
                  <p>
                    {countdown}秒後に自動的に申し込み画面に戻ります
                  </p>
                )}
              </div>
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
      </div>
    </div>
  );
}