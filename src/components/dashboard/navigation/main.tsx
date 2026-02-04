import { Link, useRouterState } from "@tanstack/react-router"
import type { NavGroup, NavMainItem } from "data/placeholder"
import { ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavMainProps {
  readonly items: readonly NavGroup[]
}

const IsComingSoon = () => (
  <span className="ml-auto rounded-md bg-muted px-2 py-1 font-medium text-[10px]">
    Soon
  </span>
)

const NavItemExpanded = ({
  item,
  isActive,
  isSubmenuOpen,
}: {
  item: NavMainItem
  isActive: (url: string, subItems?: NavMainItem["subItems"]) => boolean
  isSubmenuOpen: (subItems?: NavMainItem["subItems"]) => boolean
}) => {
  return (
    <Collapsible
      className="group/collapsible"
      key={item.title}
      open={isSubmenuOpen(item.subItems)}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger className="w-full">
          {item.subItems ? (
            <SidebarMenuButton
              disabled={item.comingSoon}
              isActive={isActive(item.url, item.subItems)}
              tooltip={item.title}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              {item.comingSoon && <IsComingSoon />}
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton
              disabled={item.comingSoon}
              isActive={isActive(item.url)}
              render={(props) => (
                <Link
                  {...props}
                  target={item.newTab ? "_blank" : undefined}
                  to={item.url}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.comingSoon && <IsComingSoon />}
                </Link>
              )}
              tooltip={item.title}
            />
          )}
        </CollapsibleTrigger>
        {item.subItems && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    aria-disabled={subItem.comingSoon}
                    isActive={isActive(subItem.url)}
                    render={(props) => (
                      <Link
                        {...props}
                        target={subItem.newTab ? "_blank" : undefined}
                        to={subItem.url}
                      >
                        {subItem.icon && <subItem.icon />}
                        <span>{subItem.title}</span>
                        {subItem.comingSoon && <IsComingSoon />}
                      </Link>
                    )}
                  />
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({ items }: NavMainProps) {
  const router = useRouterState()
  const pathname = router.location.pathname

  const isActive = (url: string, subItems?: NavMainItem["subItems"]) => {
    if (pathname === url) {
      return true
    }
    if (subItems?.some((subItem) => pathname === subItem.url)) {
      return true
    }
    return false
  }

  const isSubmenuOpen = (subItems?: NavMainItem["subItems"]) => {
    return subItems?.some((subItem) => pathname === subItem.url) ?? false
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((group) => (
            <div key={group.id}>
              {group.label && (
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              )}
              {group.items.map((item) => (
                <NavItemExpanded
                  isActive={isActive}
                  isSubmenuOpen={isSubmenuOpen}
                  item={item}
                  key={item.title}
                />
              ))}
            </div>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
