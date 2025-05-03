import { Button, Group, Modal, Text } from "@mantine/core";
import { useLocation } from "react-router-dom";

interface LoginModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ opened, onClose, title }) => {
  const location = useLocation();
  const path = location.pathname;
  const handleLogin = () => {
    onClose();
    localStorage.setItem('redirect_path', path);
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  }

  return (
    <Modal centered opened={opened} onClose={onClose} title={title} zIndex={1100}>
      <Text>僅開放 <strong>@gm2.nutn.edu.tw</strong> 的 Google 帳號登入或註冊，未註冊用戶將自動註冊</Text>
      <Group justify="flex-end">
        <Button variant="light" onClick={onClose}>取消</Button>
        <Button variant="filled" onClick={() => handleLogin()}>確定</Button>
      </Group>
    </Modal>
  )
};

export default LoginModal;