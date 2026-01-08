import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import { useLocation } from 'react-router-dom'

interface LoginModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ opened, onClose, title }) => {
  const location = useLocation()
  const blockedRedirectPaths = ['/mailError']
  const path = blockedRedirectPaths.includes(location.pathname) ? '/' : location.pathname
  const handleLogin = () => {
    onClose()
    localStorage.setItem('redirect_path', path)
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`
  }

  return (
    <Modal
      centered
      opened={opened}
      onClose={onClose}
      title={title}
      zIndex={1100}
      radius='md'
      padding='lg'
    >
      <Stack gap='sm'>
        <Text>
          僅開放 <strong>@gm2.nutn.edu.tw</strong> 的 Google 帳號登入或註冊，
          未註冊用戶將自動註冊。
        </Text>
        <Text size='sm' c='dimmed'>
          ⚠️ 請放心，資料庫或平台的任何地方皆未儲存您的 email 資訊，
          email 僅供平台辨識是否為南大的學生（平台只會存下 Google 提供的 sub id）。
        </Text>
      </Stack>

      <Group justify='flex-end' mt='md'>
        <Button variant='light' onClick={onClose}>
          取消
        </Button>
        <Button variant='filled' onClick={handleLogin}>
          確定
        </Button>
      </Group>
    </Modal>
  )
}

export default LoginModal