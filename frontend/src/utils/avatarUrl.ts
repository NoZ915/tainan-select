const getApiBaseUrl = (): string => {
  return (import.meta.env.VITE_API_BASE_URL || '')
    .replace(/\/$/, '')
    .replace(/\/api$/, '')
}

export const getStaticAssetSrc = (assetPath?: string | null): string | null => {
  if (!assetPath) {
    return null
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath
  }

  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`
  return `${getApiBaseUrl()}${normalizedPath}`
}

export const getAvatarSrc = (avatar?: string | null): string | null => {
  if (!avatar) {
    return null
  }

  return `${getApiBaseUrl()}/avatars/${avatar}`
}
