import { Calendar, History } from "lucide-react"
import { AppShell } from "./AppShell"
import type { NavGroup } from "@/components/layout/AppSidebar"

const navGroups: NavGroup[] = [
  {
    items: [
      {
        to: "/organizer",
        label: "My events",
        end: true,
        icon: <Calendar className="h-5 w-5 shrink-0" />,
      },
      {
        to: "/organizer/history",
        label: "History",
        icon: <History className="h-5 w-5 shrink-0" />,
      },
    ],
  },
]

export function OrganizerLayout() {
  return (
    <AppShell
      sidebarStorageKey="Sportech_organizer_sidebar_collapsed"
      brandTitle="Sportech"
      roleLabel="Organiser"
      brandShort="ST"
      navGroups={navGroups}
    />
  )
}
