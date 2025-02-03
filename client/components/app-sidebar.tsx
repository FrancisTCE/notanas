"use client"

import * as React from "react"
import {
  BookOpen,
  GalleryVerticalEnd,
  Folder,
  Settings2,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Francisco Ferreira",
    email: "franciscoferreiratce@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Notanas",
      logo: GalleryVerticalEnd,
      plan: "Simple",
    }
  ],
  navMain: [
    {
      title: "Drive",
      url: "#",
      icon: Folder,
      isActive: true,
      items: [
        {
          title: "Files",
          url: "/files",
        },
        {
          title: "Search",
          url: "/search",
        },
        {
          title: "One Time Links",
          url: "onetimelinks",
        },
        {
          title: "Logs",
          url: "/logs",
        },
        {
          title: "Settings",
          url: "/settings",
        },
        
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "GitHub",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Add a User",
          url: "#",
        },
        {
          title: "Change Password",
          url: "#",
        },
        {
          title: "One Time Links (OTL)",
          url: "#",
        },
      ],
    },
    {
      title: "Mounted Volume at 10% (128/1280 GB)",
      url: "#",
      icon: Folder,
      isActive: true,
    },
  ],
  
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
