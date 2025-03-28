import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { Button, Text } from "@mantine/core";
import { useLogoutUser } from "../hooks/auth/useLogoutUser";
import styles from "../styles/components/AuthButton.module.css";
import LoginModal from "./LoginModal";

interface AuthButtonProps {
  className?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({ className }) => {
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
          <Text>{user?.name}</Text>
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

      <LoginModal opened={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}

export default AuthButton;