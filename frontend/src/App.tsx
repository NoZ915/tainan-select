import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';

function App() {
  const { logout } = useAuthStore(); 

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='));

    if (!token) {
      localStorage.removeItem('auth-storage');
      logout(); 
    }
  }, [logout]); 
  
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default App
