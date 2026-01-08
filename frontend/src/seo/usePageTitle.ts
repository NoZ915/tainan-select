import { useEffect } from 'react'
import { isNonEmptyText } from './text.ts'

type UsePageTitleOptions = {
  /**
   * If true, will not update document.title when title is empty.
   * Default: true
   */
  skipWhenEmpty?: boolean
}

/**
 * Set document.title whenever the provided title changes.
 * Use this in pages where the title depends on fetched data (e.g. course detail).
 */
export function usePageTitle(pageTitle: string, options: UsePageTitleOptions = {}): void {
  const { skipWhenEmpty = true } = options

  useEffect(() => {
    if (skipWhenEmpty && !isNonEmptyText(pageTitle)) {
      return
    }

    document.title = pageTitle
  }, [pageTitle, skipWhenEmpty])
}
