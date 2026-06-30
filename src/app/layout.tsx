import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth-provider";
import { AppLayoutWrapper } from "@/components/layout/app-layout-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Scout | Hire with evidence, not intuition",
  description:
    "Scout analyzes resumes, projects, GitHub activity, assessments, and job requirements to help recruiting teams make transparent, explainable hiring decisions.",
  keywords: [
    "AI recruitment",
    "candidate screening",
    "resume parsing",
    "talent intelligence",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
          <TooltipProvider>
            <AppLayoutWrapper>{children}</AppLayoutWrapper>
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
