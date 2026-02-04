import { Link } from "@tanstack/react-router"
import { sidebarMenu } from "data/placeholder"
import { Command } from "lucide-react"
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "../navigation/main"
import { NavUser } from "../navigation/user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Collapsible>
          <SidebarMenu>
            <SidebarMenuItem>
              <CollapsibleTrigger>
                <SidebarMenuButton
                  className="w-auto!"
                  render={(props) => (
                    <Link {...props} to="/dashboard">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <Command className="size-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-base">
                          {import.meta.env.VITE_APP_TITLE || "Stokie"}
                        </span>
                      </div>
                    </Link>
                  )}
                  size="lg"
                />
              </CollapsibleTrigger>
            </SidebarMenuItem>
          </SidebarMenu>
        </Collapsible>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarMenu} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
