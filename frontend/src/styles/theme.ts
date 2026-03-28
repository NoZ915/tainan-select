import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'brick-red', // 自訂顏色名稱
  colors: {
    'brick-red': [
      '#ffeded',
      '#f5dad9',
      '#e8b3b1',
      '#dc8986',
      '#d16662',
      '#cb504a',
      '#c9443e',
      '#b23631',
      '#9f2e2a',
      '#8c2422'
    ],
  },
  fontFamily:
    'Verdana, "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  components: {
    Pagination: {
      styles: {
        control: {
          border: '2px solid black',
        },
      },
    },
    Modal: {
      styles: {
        content: {
          border: '2px solid black',
          boxShadow: '6px 6px 0 black',
          borderRadius: '12px',
        },
        header: {
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '12px',
          marginBottom: '4px',
        },
        title: {
          fontWeight: 700,
          fontSize: '1rem',
        },
      },
    },
  },
})