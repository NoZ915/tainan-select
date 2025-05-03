import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { Button, Text } from "@mantine/core";
import { useLogoutUser } from "../hooks/auth/useLogoutUser";
import styles from "../styles/components/AuthButton.module.css";
import LoginModal from "./LoginModal";
import { Link } from "react-router-dom";

interface AuthButtonProps {
  className?: string;
  onClick?: () => void
}

const AuthButton: React.FC<AuthButtonProps> = ({ className, onClick }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { mutate: logoutUser } = useLogoutUser();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      logoutUser();
    } catch (error) {
      console.error("登出失敗", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className={className}>
      {isAuthenticated ? (
        <>
          <Text component={Link} to="/profile" onClick={onClick}>{user?.name}</Text>
          <Button onClick={handleLogout} variant="outline" color="brick-red.6">
            {isLoggingOut ? '登出中...' : `登出`}
          </Button>
        </>

      ) : (
        <Button
          onClick={() => setIsLoginModalOpen(true)}
          className={styles.loginButton}
        >
          登入/註冊
        </Button>
      )}

      <LoginModal opened={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="登入 / 註冊" />
    </div>
  );
}

export default AuthButton;