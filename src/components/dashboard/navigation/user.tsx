import { useRouteContext } from "@tanstack/react-router"
import {
  CircleUser,
  CreditCard,
  EllipsisVertical,
  LogOut,
  MessageSquareDot,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { auth } from "@/lib/auth/client"

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function NavUser() {
  const { isMobile } = useSidebar()
  const session = useRouteContext({ from: "/dashboard" })

  if (!session?.user) {
    return null
  }

  const { user } = session

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Menu>
          <MenuTrigger
            render={(props) => (
              <SidebarMenuButton
                {...props}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage alt={user.name} src={user.image || undefined} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-muted-foreground text-xs">
                    {user.email}
                  </span>
                </div>
                <EllipsisVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            )}
          />
          <MenuPopup
            align="end"
            className="w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage alt={user.name} src={user.image || undefined} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-muted-foreground text-xs">
                  {user.email}
                </span>
              </div>
            </div>
            <MenuSeparator />
            <MenuGroup>
              <MenuItem>
                <CircleUser className="size-4" />
                <span>Akun</span>
              </MenuItem>
              <MenuItem>
                <CreditCard className="size-4" />
                <span>Penagihan</span>
              </MenuItem>
              <MenuItem>
                <MessageSquareDot className="size-4" />
                <span>Notifikasi</span>
              </MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem
              onClick={() =>
                auth.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      location.reload()
                    },
                  },
                })
              }
            >
              <LogOut className="size-4" />
              <span>Keluar</span>
            </MenuItem>
          </MenuPopup>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
