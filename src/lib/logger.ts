// セキュアなログ出力ユーティリティ

interface LogData {
  [key: string]: any
}

class SecureLogger {
  private isProduction = process.env.NODE_ENV === 'production'
  
  // 機密情報をフィルタリング
  private filterSensitiveData(data: LogData): LogData {
    if (typeof data !== 'object' || data === null) {
      return data
    }
    
    const filtered = { ...data }
    const sensitiveKeys = [
      'password',
      'token',
      'key',
      'secret',
      'phone',
      'email',
      'birth_date',
      'name_kana',
      'address'
    ]
    
    for (const key in filtered) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        filtered[key] = '***REDACTED***'
      }
    }
    
    return filtered
  }
  
  log(message: string, data?: LogData) {
    if (this.isProduction) {
      console.log(message, data ? this.filterSensitiveData(data) : '')
    } else {
      console.log(message, data)
    }
  }
  
  error(message: string, error?: any) {
    console.error(message, error)
  }
  
  warn(message: string, data?: LogData) {
    console.warn(message, data ? this.filterSensitiveData(data) : '')
  }
}

export const logger = new SecureLogger()