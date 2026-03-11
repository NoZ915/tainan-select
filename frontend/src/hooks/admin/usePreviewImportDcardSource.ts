import { useMutation } from '@tanstack/react-query'
import { previewImportDcardSource } from '../../apis/adminAPI'

export const usePreviewImportDcardSource = () => {
  return useMutation({
    mutationFn: previewImportDcardSource,
  })
}
