import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { theme } from '../src/theme.ts';

import App from './App.tsx'
import '@mantine/core/styles.css';
import './styles/global.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </QueryClientProvider>

)
