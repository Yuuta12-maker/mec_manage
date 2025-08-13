'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { ChevronDown, Search, Filter, FileText, Settings } from 'lucide-react'

export default function AdsDashboard() {
  const [dateRange, setDateRange] = useState('2025年8月5日 - 終了日を設定しない')

  // サンプルデータ
  const chartData = [
    { date: 'Aug 08', impressions: 400, clicks: 8, sales: 87, cost: 20 },
    { date: 'Aug 09', impressions: 550, clicks: 12, sales: 0, cost: 20 },
    { date: 'Aug 10', impressions: 700, clicks: 15, sales: 331, cost: 14 },
    { date: 'Aug 11', impressions: 800, clicks: 21, sales: 455, cost: 8 },
    { date: 'Aug 12', impressions: 620, clicks: 18, sales: 0, cost: 1 },
    { date: 'Aug 13', impressions: 450, clicks: 12, sales: 0, cost: 0 },
  ]

  const campaignData = [
    {
      id: '1',
      name: '商品ターゲティング - 2025/8/8 19:2...',
      status: 'active',
      impressions: 1713,
      clicks: 21,
      orders: 1,
      sales: 87,
      cost: 418,
      acos: 0
    },
    {
      id: '2',
      name: '気功キーキーワード',
      status: 'active',
      impressions: 1713,
      clicks: 21,
      orders: 1,
      sales: 331,
      cost: 418,
      acos: 455
    }
  ]

  const totalMetrics = {
    impressions: 1713,
    clicks: 21,
    sales: 455,
    cost: 418
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-bold">amazon ads</div>
              </div>
              <nav className="ml-8 hidden md:flex space-x-8">
                <a href="#" className="text-orange-600 font-medium border-b-2 border-orange-600 pb-4">スポンサー広告</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 pb-4">キャンペーンマネージャー</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 pb-4">すべてのキャンペーン</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 pb-4">キャンペーン設計依頼状況</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 pb-4">マニュアル</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden md:block">Sponsored ads - Author</span>
              <span className="text-sm text-gray-600 hidden md:block">スポンサー広告、現役の論理</span>
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">👤</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2 text-gray-500" />
              <span className="font-medium">レコメンデーション</span>
            </div>
            <nav className="space-y-1">
              <a href="#" className="flex items-center text-orange-600 bg-orange-50 px-3 py-2 rounded">
                <span className="mr-2">📢</span>
                <span className="text-sm">スポンサー広告</span>
              </a>
              <a href="#" className="flex items-center text-gray-600 hover:bg-gray-50 px-3 py-2 rounded">
                <span className="mr-2">📊</span>
                <span className="text-sm">キャンペーンマネージャー</span>
              </a>
              <a href="#" className="flex items-center text-gray-600 hover:bg-gray-50 px-3 py-2 rounded">
                <span className="mr-2">📋</span>
                <span className="text-sm">事例</span>
              </a>
              <a href="#" className="flex items-center text-gray-600 hover:bg-gray-50 px-3 py-2 rounded">
                <span className="mr-2">🎨</span>
                <span className="text-sm">クリエイティブツール</span>
              </a>
              <a href="#" className="flex items-center text-gray-600 hover:bg-gray-50 px-3 py-2 rounded">
                <span className="mr-2">📈</span>
                <span className="text-sm">広告プランナー</span>
              </a>
              <a href="#" className="flex items-center text-gray-600 hover:bg-gray-50 px-3 py-2 rounded">
                <span className="mr-2">📊</span>
                <span className="text-sm">効果測定とレポート</span>
              </a>
              <a href="#" className="flex items-center text-gray-600 hover:bg-gray-50 px-3 py-2 rounded">
                <span className="mr-2">🔧</span>
                <span className="text-sm">ツールとリソース</span>
              </a>
              <a href="#" className="flex items-center text-gray-600 hover:bg-gray-50 px-3 py-2 rounded">
                <span className="mr-2">⚙️</span>
                <span className="text-sm">管理</span>
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-50">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">気功術_マニュアル</h1>
            <div className="flex flex-wrap items-center text-sm text-gray-600 gap-4">
              <span>タイプ: スポンサープロダクト広告 - マニュアルターゲティング</span>
              <span className="flex items-center">
                <span className="mr-1">🌍</span>
                日本
              </span>
              <span className="flex items-center">
                <span className="mr-1">📅</span>
                掲載期間: {dateRange}
              </span>
              <span className="flex items-center">
                <span className="mr-1">💰</span>
                予算: ¥100 - 1日当たりの
              </span>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">コスト</p>
                  <p className="text-2xl font-bold text-gray-900">¥{totalMetrics.cost}</p>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">インプレッション</p>
                  <p className="text-2xl font-bold text-teal-600">{totalMetrics.impressions.toLocaleString()}</p>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">クリック数</p>
                  <p className="text-2xl font-bold text-pink-600">{totalMetrics.clicks}</p>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">売上</p>
                  <p className="text-2xl font-bold text-blue-600">¥{totalMetrics.sales}</p>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="h-80 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="#14b8a6" 
                    strokeWidth={3}
                    dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="clicks" 
                    stroke="#ec4899" 
                    strokeWidth={3}
                    dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <Bar dataKey="impressions" fill="#14b8a6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campaign Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 transition-colors">
                    広告グループの作成
                  </button>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="広告グループを探す"
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span>数り込み条件</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  <button className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span>一括アクション</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  <button className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span>列</span>
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">期間: 08/01 - 2025/08/13</span>
                  <button className="px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
                    エクスポート
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      実施中
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      広告グループ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      入札額...
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ターゲ...
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      支出
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      オーダー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      売上
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACOS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaignData.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            campaign.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                          }`}></div>
                          {campaign.status === 'active' ? '配信中' : '一時停止'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          配信中 ℹ️
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">¥20</td>
                      <td className="px-6 py-4 text-sm text-blue-600 underline cursor-pointer">{campaign.id === '1' ? '8' : '14'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">1</td>
                      <td className="px-6 py-4 text-sm text-gray-900">¥{campaign.id === '1' ? '87' : '331'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{campaign.id === '1' ? '—' : '1'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{campaign.id === '1' ? '—' : '¥455'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{campaign.id === '1' ? '—' : campaign.acos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-sm text-gray-700 font-medium">合計: 2</span>
                <div className="flex items-center space-x-8 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500">支出</span>
                    <span className="font-bold text-gray-900">¥418</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">オーダー</span>
                    <span className="font-bold text-gray-900">1</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-500">売上</span>
                    <span className="font-bold text-gray-900">¥455</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}