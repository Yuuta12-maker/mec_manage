'use client'

import { useState, useEffect } from 'react'

interface DangerousDeleteConfirmProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  clientName: string
  clientId: string
  warningMessage?: string
}

export default function DangerousDeleteConfirm({
  isOpen,
  onClose,
  onConfirm,
  title,
  clientName,
  clientId,
  warningMessage = "この操作は元に戻すことができません。関連するすべてのデータが完全に削除されます。"
}: DangerousDeleteConfirmProps) {
  const [step, setStep] = useState(1)
  const [confirmText, setConfirmText] = useState('')
  const [clientNameConfirm, setClientNameConfirm] = useState('')
  const [deleteReasonConfirm, setDeleteReasonConfirm] = useState('')
  const [countdown, setCountdown] = useState(10)
  const [canProceed, setCanProceed] = useState(false)
  
  const expectedText = 'DELETE_CLIENT_PERMANENTLY'
  const expectedReason = 'データを完全に削除することを理解しています'

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setConfirmText('')
      setClientNameConfirm('')
      setDeleteReasonConfirm('')
      setCountdown(10)
      setCanProceed(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (step === 2 && countdown === 0) {
      setCanProceed(true)
    }
  }, [step, countdown])

  const handleStep1Proceed = () => {
    if (clientNameConfirm.trim() === clientName && 
        confirmText === expectedText &&
        deleteReasonConfirm === expectedReason) {
      setStep(2)
    }
  }

  const handleFinalConfirm = () => {
    onConfirm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 警告ヘッダー */}
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-900">{title}</h3>
              <p className="text-sm text-red-600">危険な操作 - 慎重に進めてください</p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              {/* 警告メッセージ */}
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">重要な警告</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{warningMessage}</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>クライアント情報</li>
                        <li>セッション履歴</li>
                        <li>支払い履歴</li>
                        <li>継続申し込み情報</li>
                        <li>メール履歴</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* クライアント情報確認 */}
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">削除対象クライアント</h4>
                <p className="text-sm text-gray-600">名前: <span className="font-medium">{clientName}</span></p>
                <p className="text-sm text-gray-600">ID: <span className="font-mono text-xs">{clientId}</span></p>
              </div>

              {/* 確認入力フィールド */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1. クライアント名を正確に入力してください
                  </label>
                  <input
                    type="text"
                    value={clientNameConfirm}
                    onChange={(e) => setClientNameConfirm(e.target.value)}
                    placeholder={clientName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    2. 以下のテキストを正確に入力してください: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{expectedText}</code>
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={expectedText}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    3. 以下の文言を正確に入力してください
                  </label>
                  <input
                    type="text"
                    value={deleteReasonConfirm}
                    onChange={(e) => setDeleteReasonConfirm(e.target.value)}
                    placeholder={expectedReason}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">入力してください: {expectedReason}</p>
                </div>
              </div>

              {/* ボタン */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleStep1Proceed}
                  disabled={
                    clientNameConfirm.trim() !== clientName ||
                    confirmText !== expectedText ||
                    deleteReasonConfirm !== expectedReason
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ進む
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900 mb-4">最終確認</h4>
                
                {countdown > 0 ? (
                  <div className="mb-6">
                    <div className="text-6xl font-bold text-red-600 mb-2">{countdown}</div>
                    <p className="text-sm text-gray-600">
                      安全のため、{countdown}秒後に削除ボタンが有効になります
                    </p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="text-2xl font-bold text-red-600 mb-2">⚠️ 最終警告 ⚠️</div>
                    <p className="text-sm text-gray-600">
                      削除ボタンをクリックすると、即座にデータが削除されます
                    </p>
                  </div>
                )}

                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <p className="text-sm text-red-800">
                    <strong>クライアント「{clientName}」</strong>とすべての関連データを<br />
                    <strong>完全に削除</strong>しようとしています。
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleFinalConfirm}
                  disabled={!canProceed}
                  className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!canProceed ? `削除 (${countdown}秒待機中)` : '完全に削除する'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}