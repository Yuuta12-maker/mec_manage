'use client'

import { useState, useEffect } from 'react'

interface BookingCalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  minDate: string
}

export default function BookingCalendar({ selectedDate, onDateSelect, minDate }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  const minDateTime = new Date(minDate)

  // 月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

  // カレンダーの最初の日（前月の日曜日）
  const firstDayOfCalendar = new Date(firstDayOfMonth)
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay())

  // カレンダーの最後の日（次月の土曜日）
  const lastDayOfCalendar = new Date(lastDayOfMonth)
  lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + (6 - lastDayOfMonth.getDay()))

  // カレンダーの日付配列を生成
  const calendarDays = []
  const currentDate = new Date(firstDayOfCalendar)
  
  while (currentDate <= lastDayOfCalendar) {
    calendarDays.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // 前月へ
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  // 次月へ
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // 日付が選択可能かチェック
  const isDateSelectable = (date: Date) => {
    return date >= minDateTime
  }

  // 日付が今月かチェック
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  // 日付が選択されているかチェック
  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false
    const selected = new Date(selectedDate)
    return date.toDateString() === selected.toDateString()
  }

  // 日付クリックハンドラー
  const handleDateClick = (date: Date) => {
    if (isDateSelectable(date) && isCurrentMonth(date)) {
      const dateString = date.toISOString().split('T')[0]
      onDateSelect(dateString)
    }
  }

  // 月と年の表示
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-lg font-semibold">
          {currentMonth.getFullYear()}年 {monthNames[currentMonth.getMonth()]}
        </div>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const selectable = isDateSelectable(date) && isCurrentMonth(date)
          const selected = isSelectedDate(date)
          const currentMonthDate = isCurrentMonth(date)

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={!selectable}
              className={`
                p-2 text-sm border rounded-md transition-colors
                ${selected 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : selectable
                  ? 'bg-white text-gray-900 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                  : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                }
                ${!currentMonthDate ? 'text-gray-300' : ''}
              `}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}