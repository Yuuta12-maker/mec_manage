'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // ローカルストレージから設定を読み込み
    const savedTheme = localStorage.getItem('darkMode')
    if (savedTheme !== null) {
      setIsDarkMode(JSON.parse(savedTheme))
    } else {
      // システムの設定を確認
      const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(systemDarkMode)
    }
  }, [])

  useEffect(() => {
    // ダークモードの状態をHTMLのクラスに反映
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // ローカルストレージに保存
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}