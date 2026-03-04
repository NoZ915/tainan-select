export const BRAND = 'TAINAN選｜南大選課評價'
export const TITLE_SEPARATOR = '｜'
export const TITLE_MAX_LENGTH = 70

export function clampTitle(title: string, maxLength: number = TITLE_MAX_LENGTH): string {
  return title.length > maxLength ? title.slice(0, maxLength - 1) + '…' : title
}

export function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
