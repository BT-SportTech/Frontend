import { ResponsiveAppShell, type AppNavItem } from './ResponsiveAppShell'

const navItems: AppNavItem[] = [
  {
    to: '/organizer',
    label: 'My events',
    end: true,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
        aria-hidden
      >
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    to: '/organizer/history',
    label: 'History',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 shrink-0"
        aria-hidden
      >
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
]

export function OrganizerLayout() {
  return (
    <ResponsiveAppShell
      sidebarStorageKey="Sportech_organizer_sidebar_collapsed"
      brandTitle="Sportech"
      brandSubtitle="Organiser"
      brandShort="ST"
      mobileHeaderTitle="Check-in"
      navItems={navItems}
      header={
        <p className="hidden text-base font-semibold text-ink/60 lg:block">
          Check-in
        </p>
      }
    />
  )
}
