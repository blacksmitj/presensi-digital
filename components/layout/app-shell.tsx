"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="grid h-screen grid-cols-1 lg:grid-cols-[18rem_1fr]">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-col">
        {/* Topbar */}
        <div className="flex h-14 items-center gap-2 px-3">
          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTitle>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </SheetTitle>
            <SheetContent side="left" className="p-0 w-72">
              <Sidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <Separator orientation="vertical" className="lg:hidden h-6" />
          <div className="truncate text-sm text-muted-foreground">
            Welcome back
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* placeholder avatar */}
            <div className="size-8 rounded-full bg-muted" />
          </div>
        </div>

        <Separator />

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
