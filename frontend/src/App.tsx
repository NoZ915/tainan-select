import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import { useAuth } from './hooks/auth/useAuth';

function App() {
  useAuth();

  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default App
