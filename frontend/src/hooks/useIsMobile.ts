import { useMediaQuery } from '@mantine/hooks'

export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 768px)') ?? false
}