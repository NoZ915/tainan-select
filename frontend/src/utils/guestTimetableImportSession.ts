export const GUEST_TIMETABLE_IMPORT_PROMPT_SESSION_KEY =
  'tainan-select:guest-timetable-import-prompt:v1'
export const GUEST_TIMETABLE_IMPORT_REQUEST_EVENT =
  'tainan-select:guest-timetable-import:request'

export const isGuestTimetableImportPromptHandled = (): boolean => {
  if (typeof window === 'undefined') return false

  try {
    return window.sessionStorage.getItem(GUEST_TIMETABLE_IMPORT_PROMPT_SESSION_KEY) === 'handled'
  } catch {
    return false
  }
}

export const markGuestTimetableImportPromptHandled = (): void => {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(GUEST_TIMETABLE_IMPORT_PROMPT_SESSION_KEY, 'handled')
  } catch {
    return
  }
}

export const clearGuestTimetableImportPromptGuard = (): void => {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(GUEST_TIMETABLE_IMPORT_PROMPT_SESSION_KEY)
  } catch {
    return
  }
}

export const requestGuestTimetableImportPrompt = (): void => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(GUEST_TIMETABLE_IMPORT_REQUEST_EVENT))
}

export const subscribeGuestTimetableImportPromptRequest = (
  listener: () => void,
): (() => void) => {
  if (typeof window === 'undefined') return () => undefined

  window.addEventListener(GUEST_TIMETABLE_IMPORT_REQUEST_EVENT, listener)
  return () => window.removeEventListener(GUEST_TIMETABLE_IMPORT_REQUEST_EVENT, listener)
}
