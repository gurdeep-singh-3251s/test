"use client";

import { usePathname } from "next/navigation";
import { Chatbot } from "@/components/chatbot";
import { Footer } from "@/components/footer";
import { MobileNav } from "@/components/header";
import { AppRail, StatusBar, TitleBar } from "@/components/os-chrome";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return children;
  }

  if (pathname.startsWith("/bill")) {
    return <div className="min-h-full bg-paper text-ink">{children}</div>;
  }

  return (
    <div className="os-desktop p-0 md:p-3">
      <div className="os-window">
        <TitleBar />
        <MobileNav />
        <div className="flex min-h-0 flex-1">
          <AppRail />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </div>
        <StatusBar />
      </div>
      <Chatbot />
    </div>
  );
}
