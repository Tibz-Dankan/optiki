import type { ReactNode } from 'react'

export type TPage = {
  title: string
  path: string
  icon?: React.ElementType
  highlightIcon?: boolean
  element?: ReactNode
  badge?: string
  showInSidebar: boolean
  children?: TPage[]
}

export type TNavGroup = {
  title?: string
  pages: TPage[]
}

export type TRoute = {
  title?: string
  homePath: string
  groups: TNavGroup[]
}
