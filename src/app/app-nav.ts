import { FileText, House, Inbox, Megaphone, Star, Users } from 'lucide-react'
import { asList, rowReader } from '@/data/json-row.reader.ts'
import navJson from './app-nav.json'

const ICONS = { home: House, inbox: Inbox, users: Users, contract: FileText, star: Star, brand: Megaphone }
const ICON_NAMES = Object.keys(ICONS) as (keyof typeof ICONS)[]

function parseNavEntry(raw: unknown) {
  const row = rowReader({ raw, where: 'app-nav.json' })
  return {
    path: row.text('path'),
    label: row.text('label'),
    icon: ICONS[row.oneOf({ key: 'icon', values: ICON_NAMES })],
    comingSoon: row.optional({ key: 'comingSoon', read: row.flag }) ?? false,
  }
}

export const APP_NAV = asList({ json: navJson, where: 'app-nav.json' }).map(parseNavEntry)

export type NavEntry = (typeof APP_NAV)[number]
