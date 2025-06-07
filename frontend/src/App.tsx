import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useCheckAuthStatus } from './hooks/auth/useCheckAuthStatus';
import Footer from './components/Footer';

function App() {
  const { logout } = useAuthStore();
  const { data } = useCheckAuthStatus();

  useEffect(() => {
    if (data && !data.authenticated) {
      localStorage.removeItem('auth-storage');
      logout();
    }
  }, [data, logout]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default App
