import {
  CalendarCheck,
  LayoutDashboard,
  School,
  UserCircle,
  Users,
} from "lucide-react"
import { AppShell } from "./AppShell"
import type { NavGroup } from "@/components/layout/AppSidebar"

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        to: "/admin",
        label: "Dashboard",
        end: true,
        icon: <LayoutDashboard className="h-5 w-5 shrink-0" />,
      },
    ],
  },
  {
    label: "Directory",
    items: [
      {
        to: "/admin/schools",
        label: "Schools",
        icon: <School className="h-5 w-5 shrink-0" />,
      },
      {
        to: "/admin/players",
        label: "Players",
        icon: <UserCircle className="h-5 w-5 shrink-0" />,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        to: "/admin/events",
        label: "Events",
        icon: <CalendarCheck className="h-5 w-5 shrink-0" />,
      },
      {
        to: "/admin/organizers",
        label: "Organisers",
        icon: <Users className="h-5 w-5 shrink-0" />,
      },
    ],
  },
]

export function AdminLayout() {
  return (
    <AppShell
      sidebarStorageKey="Sportech_admin_sidebar_collapsed"
      brandTitle="Sportech"
      roleLabel="Admin"
      brandShort="ST"
      navGroups={navGroups}
    />
  )
}
