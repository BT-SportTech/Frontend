import hotToast from 'react-hot-toast'

const baseStyle = {
  borderRadius: 0,
  padding: '16px 20px',
  minHeight: '4.5rem',
  minWidth: '22rem',
  maxWidth: '28rem',
  fontSize: '1rem',
  fontWeight: 600,
  lineHeight: 1.4,
  boxShadow: '0 8px 20px rgb(15 23 42 / 0.18)',
} as const

export const toast = {
  success: (message: string) =>
    hotToast.success(message, {
      style: {
        ...baseStyle,
        background: '#22c55e',
        color: '#052e16',
        boxShadow: '0 8px 20px rgb(5 46 22 / 0.22)',
      },
      iconTheme: {
        primary: '#14532d',
        secondary: '#86efac',
      },
    }),

  error: (message: string) =>
    hotToast.error(message, {
      style: {
        ...baseStyle,
        background: '#ef4444',
        color: '#450a0a',
        boxShadow: '0 8px 20px rgb(69 10 10 / 0.22)',
      },
      iconTheme: {
        primary: '#7f1d1d',
        secondary: '#fca5a5',
      },
    }),

  info: (message: string) =>
    hotToast(message, {
      icon: 'ℹ️',
      style: {
        ...baseStyle,
        background: '#0ea5e9',
        color: '#082f49',
        boxShadow: '0 8px 20px rgb(8 47 73 / 0.22)',
      },
    }),
}
