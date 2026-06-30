"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
// import { GlobalCopilot } from "@/components/layout/global-copilot";

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/") {
      router.push("/");
    } else if (status === "authenticated" && pathname === "/") {
      router.push("/dashboard");
    }
  }, [status, pathname, router]);

  // If we are on the landing page, do not render the Sidebar and constrained layout
  if (pathname === "/") {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null; // Will redirect via useEffect
  }

  // Everyone gets standard SaaS Dashboard layout now
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      {/* <GlobalCopilot /> */}
    </div>
  );
}
