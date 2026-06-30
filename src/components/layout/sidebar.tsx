"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitMerge,
  BarChart2,
  Settings,
  Brain,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ScoutLogo } from "@/components/ui/scout-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Candidates", href: "/candidates", icon: Users },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <ScoutLogo className="h-6 w-6" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight whitespace-nowrap opacity-100 transition-opacity duration-300">
            Scout
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const linkContent = (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive && "text-primary"
                )}
              />
              {!collapsed && (
                <span className="animate-fade-in">{item.name}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-brand" />
              )}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger render={linkContent} />
                <TooltipContent side="right" sideOffset={10}>
                  {item.name}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border/50 p-3 flex flex-col gap-2">
        {session?.user && (
          <div className={cn("flex items-center gap-3 rounded-lg px-2 py-2", collapsed ? "justify-center" : "")}>
            {session.user.image ? (
              <Image src={session.user.image} alt="Avatar" width={32} height={32} className="h-8 w-8 rounded-full border border-border" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-primary">
                  {session.user.name?.[0] || session.user.email?.[0] || "U"}
                </span>
              </div>
            )}
            {!collapsed && (
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-xs font-medium truncate">{session.user.name || session.user.email}</span>
                <span className="text-[10px] text-muted-foreground truncate">Workspace User</span>
              </div>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-500/10", collapsed ? "px-0" : "")}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          {collapsed ? "Out" : "Sign Out"}
        </Button>
      </div>

      {/* Collapse & Theme */}
      <div className={cn("border-t border-border/50 p-3 flex gap-2", collapsed ? "flex-col items-center" : "items-center")}>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className={cn("justify-center", collapsed ? "w-9 h-9 p-0" : "flex-1")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
