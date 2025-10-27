"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Users,
  Calendar,
  BarChart3,
  LogOut,
} from "lucide-react";
import { LogoutButton } from "../auth/logout-button";
import { Button } from "../ui/button";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workspaces", href: "/workspaces", icon: Users },
  { label: "Users", href: "/users", icon: Users },
  { label: "Schedule", href: "/schedule", icon: Calendar },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const secondaryNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void; // untuk menutup drawer di mobile
}) {
  const pathname = usePathname();

  const Item = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "h-full w-72 shrink-0 border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="size-7 rounded-lg bg-primary/15" />
        <div className="font-semibold">Presensi Digital</div>
      </div>
      <Separator />
      <ScrollArea className="h-[calc(100vh-3.5rem)] px-3 py-3">
        <div className="space-y-1">
          {mainNav.map((n) => (
            <Item key={n.href} item={n} />
          ))}
        </div>

        <div className="my-4">
          <Separator />
        </div>

        <div className="space-y-1">
          {secondaryNav.map((n) => (
            <Item key={n.href} item={n} />
          ))}
        </div>

        <div className="mt-6">
          <LogoutButton>
            <div className="w-full text-left text-sm text-muted-foreground hover:text-destructive flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-destructive/10 transition">
              <LogOut className="h-4 w-4" />
              Keluar
            </div>
          </LogoutButton>
        </div>
      </ScrollArea>
    </aside>
  );
}
