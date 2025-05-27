"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconHome,
  IconMessageCircle,
  IconRobot,
  IconAtom,
  IconFile,
  IconGraph,
  IconShield,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { isAdminUser } from "@/lib/utils/admin"

const baseNavMain = [
  {
    title: "Home",
    url: "/home",
    icon: IconHome,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: IconMessageCircle,
  },
  {
    title: "Agent",
    url: "/agent",
    icon: IconRobot,
  },
  {
    title: "Cosmograph",
    url: "/cosmograph",
    icon: IconAtom,
  },
  {
    title: "System",
    url: "/system",
    icon: IconSettings,
  },
]

const staticData = {
  navClouds: [],
  navSecondary: [],
  documents: [
    {
      name: "Files",
      url: "/documents",
      icon: IconFile,
    },
    {
      name: "Unified",
      url: "/unified",
      icon: IconChartBar,
    },
    {
      name: "Search",
      url: "/documents/search",
      icon: IconSearch,
    },
    {
      name: "Graphs",
      url: "/graphs",
      icon: IconGraph,
    },
    {
      name: "System",
      url: "/documents/system",
      icon: IconSettings,
    },
    {
      name: "Reports",
      url: "/documents/reports",
      icon: IconReport,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession()
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Create user data from session or fallback
  const userData = React.useMemo(() => {
    if (!isClient || status === "loading") {
      // Return consistent fallback during SSR and loading
      return {
        name: "Loading...",
        email: "loading@example.com",
        avatar: "/avatars/default.jpg",
      }
    }
    
    if (session?.user) {
      return {
        name: session.user.name || "User",
        email: session.user.email || "user@example.com",
        avatar: session.user.image || "/avatars/default.jpg",
      }
    }
    
    // Fallback for when session is not available
    return {
      name: "Guest",
      email: "guest@example.com",
      avatar: "/avatars/default.jpg",
    }
  }, [session, status, isClient])

  // Create navigation items with conditional admin link
  const navMain = React.useMemo(() => {
    const items = [...baseNavMain]
    
    // Insert admin link between Cosmograph and System if user is admin
    if (isClient && session?.user?.email && isAdminUser(session.user.email)) {
      const cosmographIndex = items.findIndex(item => item.title === "Cosmograph")
      if (cosmographIndex !== -1) {
        items.splice(cosmographIndex + 1, 0, {
          title: "Admin",
          url: "/admin",
          icon: IconShield,
        })
      }
    }
    
    return items
  }, [isClient, session?.user?.email])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">MOONGRAPH</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={staticData.documents} />
        <NavSecondary items={staticData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
