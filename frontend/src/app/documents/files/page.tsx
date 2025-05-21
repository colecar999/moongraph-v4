import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function FilesPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 p-4">
            {/* Placeholder for file management content */}
            <h2 className="text-xl font-semibold">Files</h2>
            <p className="text-muted-foreground">
              Manage your documents and files here.
            </p>
            {/* You can add components for file listing, uploading, etc. here */}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 