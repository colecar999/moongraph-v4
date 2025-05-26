import { IconUpload, IconSettings } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function DocumentPageButtons() {
  return (
    <>
      <Button variant="outline" size="sm">
        <IconUpload className="h-4 w-4 mr-2" />
        Upload
      </Button>
      <Button variant="outline" size="sm">
        <IconSettings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </>
  )
} 