import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Corporate Brand Colors
        primary: '#c50502',
        'primary-foreground': '#ffffff',
        secondary: '#1f2937',
        'secondary-foreground': '#ffffff',
        
        // Corporate UI Colors
        brand: {
          red: '#c50502',
          'red-hover': '#a20401',
          'red-light': '#dc2626',
          'red-dark': '#991b1b',
          gray: '#1f2937',
          'gray-light': '#374151',
          blue: '#0073bb',
          'blue-hover': '#005a96',
        },
        
        // Status Colors
        success: '#067d68',
        warning: '#b7791f',
        error: '#d13212',
        info: '#0073bb',
        
        // Neutral Colors
        gray: {
          50: '#f8f9fa',
          100: '#f1f3f4',
          200: '#e8eaed',
          300: '#dadce0',
          400: '#bdc1c6',
          500: '#9aa0a6',
          600: '#80868b',
          700: '#5f6368',
          800: '#3c4043',
          900: '#202124',
        },
        
        // Background Colors
        background: {
          primary: '#ffffff',
          secondary: '#f8f9fa',
          tertiary: '#f1f3f4',
        }
      },
      
      fontFamily: {
        sans: ['Montserrat', 'Noto Sans JP', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Montserrat', 'Noto Sans JP', 'system-ui', 'sans-serif'],
      },
      
      boxShadow: {
        'sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 25px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 40px rgba(0, 0, 0, 0.1)',
      },
      
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
  plugins: [],
}
export default config