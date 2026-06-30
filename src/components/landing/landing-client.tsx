"use client";

import { signIn } from "next-auth/react";
import { ScoutLogo } from "@/components/ui/scout-logo";
import { ThemeToggle } from "@/components/theme-toggle";

interface LandingClientProps {
  providers: {
    google: boolean;
    github: boolean;
    microsoft: boolean;
    demoMode: boolean;
  };
}

export function LandingClient({ providers }: LandingClientProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 relative items-center justify-center p-4">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md p-8 bg-white dark:bg-[#0A0A0A] rounded-xl border border-[#E5E7EB] dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ScoutLogo className="h-8 w-8 text-[#111827] dark:text-white" />
            <span className="text-2xl font-bold tracking-tight text-[#111827] dark:text-white">Scout</span>
          </div>
          <h1 className="text-xl font-medium tracking-tight text-[#111827] dark:text-white">
            Recruiter Cockpit
          </h1>
          <p className="text-[#6B7280] dark:text-zinc-400 text-sm mt-2">
            Enterprise Hiring Intelligence
          </p>
        </div>

        <div className="space-y-4">
          {providers.demoMode && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                await signIn("demo-credentials", {
                  email: fd.get("email"),
                  password: fd.get("password"),
                  callbackUrl: "/dashboard",
                  redirect: true,
                });
              }}
              className="space-y-3 p-5 border border-blue-200 dark:border-blue-900/50 rounded-lg bg-blue-50/50 dark:bg-blue-950/20"
            >
              <div className="text-center mb-2">
                <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded">
                  Demo Mode Active
                </span>
              </div>
              <input
                name="email"
                type="email"
                defaultValue="demo@scout.ai"
                placeholder="Email"
                className="w-full h-10 px-3 text-sm border border-[#E5E7EB] dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="password"
                type="password"
                defaultValue="demo"
                placeholder="Password"
                className="w-full h-10 px-3 text-sm border border-[#E5E7EB] dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-[#111827] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Sign in to Demo
              </button>
            </form>
          )}

          {providers.demoMode && (providers.google || providers.microsoft || providers.github) && (
            <div className="flex items-center gap-3 text-xs text-[#6B7280] dark:text-zinc-500 py-2">
              <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-zinc-800" />
              <span>or</span>
              <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-zinc-800" />
            </div>
          )}

          {providers.google && (
            <button 
              className="w-full flex items-center justify-center gap-3 h-11 text-sm font-medium bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 text-[#111827] dark:text-white rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#ffc107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#ff3d00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976d2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
              Continue with Google
            </button>
          )}

          {providers.microsoft && (
            <button 
              className="w-full flex items-center justify-center gap-3 h-11 text-sm font-medium bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 text-[#111827] dark:text-white rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21"><path fill="#f25022" d="M0 0h10v10H0z"/><path fill="#7fba00" d="M11 0h10v10H11z"/><path fill="#00a4ef" d="M0 11h10v10H0z"/><path fill="#ffb900" d="M11 11h10v10H11z"/></svg>
              Continue with Microsoft
            </button>
          )}

          {providers.github && (
            <button 
              className="w-full flex items-center justify-center gap-3 h-11 text-sm font-medium bg-white dark:bg-zinc-900 border border-[#E5E7EB] dark:border-zinc-800 text-[#111827] dark:text-white rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/></svg>
              Continue with GitHub
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-[#6B7280] dark:text-zinc-500">
        &copy; {new Date().getFullYear()} Scout Intelligence Inc.
      </div>
    </div>
  );
}
