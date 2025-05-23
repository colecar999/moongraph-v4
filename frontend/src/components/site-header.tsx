"use client";

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export function SiteHeader() {
  const pathname = usePathname();
  
  // Get page title based on the current route
  const pageTitle = useMemo(() => {
    const path = pathname.split('/').pop() || '';
    
    // Map routes to titles with capitalized first letter
    const titles: Record<string, string> = {
      "dashboard": "Dashboard",
      "home": "Home", 
      "chat": "Chat",
      "agent": "Agent",
      "cosmograph": "Cosmograph",
      "system": "System",
      "graphs": "Graphs",
      "files": "Files",
      "search": "Search",
      "reports": "Reports",
    };
    
    return titles[path] || "Documents";
  }, [pathname]);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
