import { useMutation } from '@tanstack/react-query'
import { addWhitelistEmail } from '../../apis/adminAPI'

export const useAddWhitelistEmail = () => {
  return useMutation({
    mutationFn: addWhitelistEmail,
  })
}
