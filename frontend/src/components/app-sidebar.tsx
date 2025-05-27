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

const staticData = {
  navMain: [
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
  ],
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
        <NavMain items={staticData.navMain} />
        <NavDocuments items={staticData.documents} />
        <NavSecondary items={staticData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
