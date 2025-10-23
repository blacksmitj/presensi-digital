import { MobileShell } from "@/components/layout/mobile-shell";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileShell>{children}</MobileShell>; // ada bottom nav
}
