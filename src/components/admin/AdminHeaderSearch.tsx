import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { TextInput } from '../ui'
import type { AdminSearchTab } from '../../interfaces'
import { useAdminSearchStore } from '../../stores/useAdminSearchStore'

const TAB_CONFIG: Record<
  AdminSearchTab,
  { match: (path: string) => boolean; placeholder: string }
> = {
  schools: {
    match: (path) => path.startsWith('/admin/schools'),
    placeholder: 'Search name, city, code…',
  },
  events: {
    match: (path) => path === '/admin/events',
    placeholder: 'Search name, sport, venue…',
  },
  players: {
    match: (path) => path === '/admin/players',
    placeholder: 'Search name, code, email…',
  },
}

function resolveTab(pathname: string): AdminSearchTab | null {
  if (TAB_CONFIG.schools.match(pathname)) return 'schools'
  if (TAB_CONFIG.events.match(pathname)) return 'events'
  if (TAB_CONFIG.players.match(pathname)) return 'players'
  return null
}

export function AdminHeaderSearch() {
  const { pathname } = useLocation()
  const tab = resolveTab(pathname)
  const storeValue = useAdminSearchStore((state) =>
    tab ? state[tab] : '',
  )
  const setSearch = useAdminSearchStore((state) => state.setSearch)
  const [draft, setDraft] = useState(storeValue)

  useEffect(() => {
    setDraft(storeValue)
  }, [tab, storeValue])

  useEffect(() => {
    if (!tab) return
    const handle = window.setTimeout(() => {
      setSearch(tab, draft.trim())
    }, 300)
    return () => window.clearTimeout(handle)
  }, [draft, tab, setSearch])

  if (!tab) return null

  return (
    <TextInput
      className="w-full py-3 text-base"
      type="search"
      placeholder={TAB_CONFIG[tab].placeholder}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      aria-label="Search"
    />
  )
}
