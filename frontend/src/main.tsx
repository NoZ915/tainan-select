import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import '@mantine/core/styles.css';
import { theme } from './styles/theme.ts';
import './styles/App.css';

import App from './App.tsx'
import CoursesPage from './pages/CoursesPage.tsx';
import CourseDetailPage from './pages/CourseDetailPage.tsx';
import DynamicPage from './pages/DynamicPage.tsx';
import FrequentPage from './pages/FrequentPage.tsx';
import OAuthCallbackPage from './pages/OAuthCallbackPage.tsx';
import MailErrorPage from './pages/MailErrorPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';

const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <CoursesPage />, index: true },
      { path: "/mailError", element: <MailErrorPage /> },
      { path: "/auth/google/callback", element: <OAuthCallbackPage /> },
      { path: "/course/:course_id", element: <CourseDetailPage /> },
      { path: "/dynamic", element: <DynamicPage /> },
      { path: "/frequent", element: <FrequentPage /> },
      { path: "/profile", element: <ProfilePage /> }
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
