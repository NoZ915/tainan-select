import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useCheckAuthStatus } from './hooks/auth/useCheckAuthStatus';

function App() {
  const { logout } = useAuthStore(); 
  const { data } = useCheckAuthStatus();

  useEffect(() => {
    if (data && !data.authenticated) {
      console.log(data)
      localStorage.removeItem('auth-storage');
      logout(); 
    }
  }, [data, logout]); 
  
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default App
