import { Accordion, Anchor, Button, Group, Modal, Stack, Text } from '@mantine/core'
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
        <Accordion variant='separated' radius='md'>
          <Accordion.Item value='privacy-qa'>
            <Accordion.Control>Q：平台會儲存我的 email 嗎？</Accordion.Control>
            <Accordion.Panel>
              <Text size='sm' c='dimmed'>
                不會！請放心，資料庫或平台的任何地方皆未儲存您的 email 資訊，
                email 僅供平台辨識是否為南大的學生（平台只會存下 Google 提供的 sub id）。
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value='whitelist-qa'>
            <Accordion.Control>Q：沒有學校 email，還能註冊嗎？</Accordion.Control>
            <Accordion.Panel>
              <Text size='sm' c='dimmed'>
                可以！若你是該校應屆生或畢業生，沒有學校 email 但仍希望分享課程評價，
                可私訊 IG
                {' '}
                <Anchor href='https://www.instagram.com/nutnselect' target='_blank' rel='noreferrer'>
                  @nutnselect
                </Anchor>
                ，並提供學生證與你想登入使用的 email，我們會協助處理白名單。
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
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
