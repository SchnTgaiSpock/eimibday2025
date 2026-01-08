"use client"

import { usePathname } from "next/navigation"

function SidebarLink({ text, href = '/' + text }: { text: string, href?: string, currentPath?: string }) {
  return <div className="sidebar-link-wrap">
    <a className="sidebar-link" href={href}>
      {text}
    </a>
  </div>
}

export function Sidebar() {
  const path = usePathname()
  return <div className="sidebar">
    <SidebarLink currentPath={path} text="Dashboard" href="/" />
    <SidebarLink currentPath={path} text="Messages" href="/messages" />
    <SidebarLink currentPath={path} text="Tasks" href="/scran" />
    <SidebarLink currentPath={path} text="Credits" href="/credits" />
  </div>
}