import { createRoot } from 'react-dom/client'
import { createHead, UnheadProvider } from '@unhead/react/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { theme } from './styles/theme.ts'
import './styles/App.css'

import { buildTitleStatic } from './seo/titles.ts'

import App from './App.tsx'
import CoursesPage from './pages/CoursesPage.tsx'
import CourseDetailPage from './pages/CourseDetailPage.tsx'
import DynamicPage from './pages/DynamicPage.tsx'
import FrequentPage from './pages/FrequentPage.tsx'
import OAuthCallbackPage from './pages/OAuthCallbackPage.tsx'
import MailErrorPage from './pages/MailErrorPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import ProtectedRoute from './pages/ProtectedRoute.tsx'

const head = createHead()
const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // 首頁 / 課程列表
      { index: true, element: <CoursesPage />},

      // 其他頁面
      { path: 'mailError', element: <MailErrorPage />, handle: { seo: { title: buildTitleStatic('信箱驗證失敗') } } },
      { path: 'auth/google/callback', element: <OAuthCallbackPage />, handle: { seo: { title: buildTitleStatic('登入中') } } },

      { path: 'course/:course_id', element: <CourseDetailPage />, handle: { seo: { title: buildTitleStatic('課程詳情') } } },

      { path: 'dynamic', element: <DynamicPage />, handle: { seo: { title: buildTitleStatic('動態') } } },
      { path: 'frequent', element: <FrequentPage />, handle: { seo: { title: buildTitleStatic('常用連結') } } },

      // 受保護的 route（未登入無法瀏覽）
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'profile', element: <ProfilePage />, handle: { seo: { title: buildTitleStatic('個人頁') } } },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <UnheadProvider head={head}>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <Notifications />
        <RouterProvider router={router} />
      </MantineProvider>
    </QueryClientProvider>,
  </UnheadProvider>

)
