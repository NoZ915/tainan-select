import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useCheckAuthStatus } from './hooks/auth/useCheckAuthStatus';
import Footer from './components/footer';

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
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

export default App
