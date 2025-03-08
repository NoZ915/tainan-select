import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createTheme, MantineProvider } from '@mantine/core'

import App from './App.tsx'

const queryClient = new QueryClient();
const theme = createTheme({
  /** Put your mantine theme override here */
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <MantineProvider theme={theme}>
      <App />    
    </MantineProvider>
  </QueryClientProvider>
  
)
