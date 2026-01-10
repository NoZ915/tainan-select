import { useHead } from '@unhead/react'
import { useLocation, useMatches } from 'react-router-dom'
import { BRAND, isNonEmptyText } from './text'

type RouteTitleContext = {
  pathname: string
  search: string
}

type SeoTitleValue = string | ((context: RouteTitleContext) => string)

type RouteHandleSeo = {
  seo?: {
    title?: SeoTitleValue
  }
}

export default function RouteHeadTitle() {
  const matches = useMatches()
  const location = useLocation()

  const ctx: RouteTitleContext = { pathname: location.pathname, search: location.search }

  const deepest = [...matches]
    .reverse()
    .find(match => typeof (match.handle as RouteHandleSeo | undefined)?.seo?.title !== 'undefined')

  const raw = (deepest?.handle as RouteHandleSeo | undefined)?.seo?.title
  const next = typeof raw === 'function' ? raw(ctx) : raw
  const finalTitle = isNonEmptyText(next) ? next : BRAND

  useHead({ title: finalTitle })
  return null
}
