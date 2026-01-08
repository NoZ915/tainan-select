import { useEffect, useRef } from 'react'
import { useLocation, useMatches } from 'react-router-dom'
import { isNonEmptyText } from './text.ts'

type RouteTitleContext = {
  pathname: string
  search: string
}

type SeoTitleValue =
  | string
  | ((context: RouteTitleContext) => string)

type RouteHandleSeo = {
  seo?: {
    title?: SeoTitleValue
  }
}

/**
 * Read `handle.seo.title` from the deepest matched route and set document.title.
 *
 * Fallback strategy:
 * - Use the initial document.title from index.html as the default title.
 * - If no route title is provided, reset to the initial title (instead of keeping previous route title).
 *
 * For dynamic titles (e.g. course detail fetched by API), use `usePageTitle(...)` in that page to override.
 */
export function useRouteTitle(): void {
  const routeMatches = useMatches()
  const location = useLocation()

  const initialDocumentTitleRef = useRef<string>(document.title)

  useEffect(() => {
    const routeTitleContext: RouteTitleContext = {
      pathname: location.pathname,
      search: location.search,
    }

    const deepestMatchWithSeoTitle = [...routeMatches]
      .reverse()
      .find((match) => {
        const routeHandleSeo = (match.handle as RouteHandleSeo | undefined)
        return typeof routeHandleSeo?.seo?.title !== 'undefined'
      })

    const routeHandleSeo = (deepestMatchWithSeoTitle?.handle as RouteHandleSeo | undefined)
    const seoTitleValue = routeHandleSeo?.seo?.title

    if (!seoTitleValue) {
      document.title = initialDocumentTitleRef.current
      return
    }

    const nextDocumentTitle =
      typeof seoTitleValue === 'function'
        ? seoTitleValue(routeTitleContext)
        : seoTitleValue

    document.title = isNonEmptyText(nextDocumentTitle)
      ? nextDocumentTitle
      : initialDocumentTitleRef.current
  }, [routeMatches, location.pathname, location.search])
}
