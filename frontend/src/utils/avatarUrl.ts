const getAvatarBaseUrl = (): string => {
  return (import.meta.env.VITE_API_BASE_URL || '')
    .replace(/\/$/, '')
    .replace(/\/api$/, '')
}

export const getAvatarSrc = (avatar?: string | null): string => {
  if (!avatar) {
    return ''
  }

  return `${getAvatarBaseUrl()}/avatars/${avatar}`
}
