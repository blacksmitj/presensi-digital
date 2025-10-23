"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Scan, List, User } from "lucide-react";

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/scan", icon: Scan, label: "Scan" },
    { href: "/riwayat", icon: List, label: "Riwayat" },
    { href: "/profil", icon: User, label: "Profil" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex justify-around">
          {tabs.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "flex flex-col gap-1 w-20 h-14",
                    active && "text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px]">{label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
