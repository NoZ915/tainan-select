const getAvatarBaseUrl = (): string => {
  return (import.meta.env.VITE_API_BASE_URL || '')
    .replace(/\/$/, '')
    .replace(/\/api$/, '')
}

export const getAvatarSrc = (avatar?: string | null): string | null => {
  if (!avatar) {
    return null
  }

  return `${getAvatarBaseUrl()}/avatars/${avatar}`
}
