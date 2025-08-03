'use client'

import { useState, useEffect } from 'react'
import { Session, Client } from '@/types'
import Link from 'next/link'

interface CalendarEvent extends Session {
  client: Client
}

interface CalendarProps {
  sessions: CalendarEvent[]
  onDateClick?: (date: Date) => void
}

export default function Calendar({ sessions, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewDate, setViewDate] = useState(new Date())

  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土']
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ]

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  const getLastDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  const getDaysInMonth = (date: Date) => {
    const firstDay = getFirstDayOfMonth(date)
    const lastDay = getLastDayOfMonth(date)
    const days: Date[] = []

    // 前月の残り日数を追加
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    // カレンダーの42日分（6週間）を生成
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }

    return days
  }

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_date).toISOString().split('T')[0]
      return sessionDate === dateStr
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === viewDate.getMonth()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setViewDate(newDate)
  }

  const goToToday = () => {
    setViewDate(new Date())
  }

  const getTypeColor = (type: string) => {
    return type === 'trial' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const days = getDaysInMonth(viewDate)

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {viewDate.getFullYear()}年 {monthNames[viewDate.getMonth()]}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
            >
              今日
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 bg-gray-50">
        {daysOfWeek.map((day, index) => (
          <div
            key={day}
            className={`px-2 py-3 text-center text-sm font-medium ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayNumber = day.getDate()
          const daySessions = getSessionsForDate(day)
          const isCurrentMonthDay = isCurrentMonth(day)
          const isTodayDay = isToday(day)

          return (
            <div
              key={index}
              className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                !isCurrentMonthDay ? 'bg-gray-50' : 'bg-white'
              } ${onDateClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => onDateClick && onDateClick(day)}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm ${
                    !isCurrentMonthDay
                      ? 'text-gray-400'
                      : isTodayDay
                      ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center font-semibold'
                      : index % 7 === 0
                      ? 'text-red-600 font-medium'
                      : index % 7 === 6
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-900'
                  }`}
                >
                  {dayNumber}
                </span>
              </div>

              {/* セッション表示 */}
              <div className="space-y-1">
                {daySessions.slice(0, 3).map((session) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className={`block px-2 py-1 text-xs rounded border transition-colors hover:shadow-sm ${getTypeColor(session.type)}`}
                  >
                    <div className="truncate font-medium">
                      {session.client.name}
                    </div>
                    <div className="truncate">
                      {new Date(session.scheduled_date).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </Link>
                ))}
                {daySessions.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">
                    +{daySessions.length - 3}件
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div>
            <span className="text-gray-600">トライアル</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
            <span className="text-gray-600">通常セッション</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div>
            <span className="text-gray-600">実施済み</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div>
            <span className="text-gray-600">キャンセル</span>
          </div>
        </div>
      </div>
    </div>
  )
}