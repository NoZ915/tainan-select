import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import '@mantine/core/styles.css';
import { theme } from './styles/theme.ts';
import './styles/App.css';

import App from './App.tsx'
import CoursePage from './pages/CoursesPage.tsx';
import DynamicPage from './pages/DynamicPage.tsx';
import FrequentPage from './pages/FrequentPage.tsx';

const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <CoursePage />, index: true },
      { path: "/dynamic", element: <DynamicPage /> },
      { path: "/frequent", element: <FrequentPage /> },
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <MantineProvider theme={theme}>
      <RouterProvider router={router} />
    </MantineProvider>
  </QueryClientProvider>

)
