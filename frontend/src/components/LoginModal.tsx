import { Button, Group, Modal, Text } from "@mantine/core";

interface LoginModalProps {
  opened: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ opened, onClose }) => {
  const handleLogin = () => {
    onClose();
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  }

  return (
    <Modal opened={opened} onClose={onClose} title="登入 / 註冊">
      <Text>僅開放 <strong>@gm2.nutn.edu.tw</strong> 的 Google 帳號登入或註冊，未註冊用戶將自動註冊</Text>
      <Group justify="flex-end">
        <Button color="gray" onClick={onClose}>取消</Button>
        <Button color="blue" onClick={() => handleLogin()}>確定</Button>
      </Group>
    </Modal>
  )
};

export default LoginModal;