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
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 font-sans selection:bg-blue-500/30">
      {/* Left Side - Content */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-24 border-r border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 relative">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ScoutLogo className="h-8 w-8 text-slate-900 dark:text-white" />
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Scout</span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
            Enterprise Hiring Intelligence
          </p>
        </div>

        <div className="max-w-md my-auto">
          <h1 className="text-5xl xl:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
            Hire with evidence,<br/>not intuition.
          </h1>
          <p className="text-lg text-slate-500 dark:text-zinc-400 leading-relaxed mb-8">
            Scout analyzes resumes, projects, GitHub activity, assessments, and job requirements to help hiring teams make faster, more transparent decisions.
          </p>
          
          <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-zinc-400">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Role Based Access
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Audit Logging
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Least Privilege
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Encrypted Candidate Records
            </li>
          </ul>
        </div>

        <div className="text-xs font-medium text-slate-400 dark:text-zinc-600">
          &copy; {new Date().getFullYear()} Scout Intelligence Inc.
        </div>
      </div>

      {/* Right Side - Auth */}
      <div className="flex-1 flex flex-col relative bg-white dark:bg-zinc-950">
        <div className="absolute top-6 right-6 z-50">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-[400px]">
            <div className="mb-10 text-center lg:text-left">
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <ScoutLogo className="h-8 w-8 text-slate-900 dark:text-white" />
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Scout</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                Sign in to Scout
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Continue with your enterprise identity provider.
              </p>
            </div>

            <div className="space-y-4">
              {/* Demo Login (Only if DEMO_MODE is true) */}
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
                  className="space-y-4 p-6 border border-blue-100 dark:border-blue-900/30 rounded-xl bg-blue-50/30 dark:bg-blue-950/10 mb-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-400">Demo Access</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded">Active</span>
                  </div>
                  <input
                    name="email"
                    type="email"
                    defaultValue="demo@scout.ai"
                    placeholder="Email"
                    className="w-full h-11 px-4 text-sm font-medium border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <input
                    name="password"
                    type="password"
                    defaultValue="demo"
                    placeholder="Password"
                    className="w-full h-11 px-4 text-sm font-medium border border-slate-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all active:scale-[0.98]"
                  >
                    Sign in to Demo
                  </button>
                </form>
              )}

              {/* Microsoft Button */}
              <button 
                className="w-full flex items-center justify-center gap-3 h-12 text-sm font-semibold bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 rounded-xl cursor-not-allowed"
                disabled
              >
                <svg className="opacity-50" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21"><path fill="#f25022" d="M0 0h10v10H0z"/><path fill="#7fba00" d="M11 0h10v10H11z"/><path fill="#00a4ef" d="M0 11h10v10H0z"/><path fill="#ffb900" d="M11 11h10v10H11z"/></svg>
                Microsoft Entra ID <span className="text-[10px] font-medium ml-1">(Coming Soon)</span>
              </button>

              {/* Google Button */}
              {providers.google && (
                <button 
                  className="w-full flex items-center justify-center gap-3 h-12 text-sm font-semibold bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white rounded-xl hover:border-slate-300 dark:hover:border-zinc-700 transition-all active:scale-[0.98] shadow-sm"
                  onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#ffc107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#ff3d00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4caf50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976d2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                  Google Workspace
                </button>
              )}

              {/* GitHub Button */}
              <button 
                className="w-full flex items-center justify-center gap-3 h-12 text-sm font-semibold bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 rounded-xl cursor-not-allowed"
                disabled
              >
                <svg className="opacity-50" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/></svg>
                GitHub <span className="text-[10px] font-medium ml-1">(Coming Soon)</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-900 text-center">
              <span className="text-xs font-bold tracking-widest uppercase text-slate-400 dark:text-zinc-600">
                Corporate SSO<br/>
                <span className="text-[9px] text-slate-300 dark:text-zinc-700">Available for Enterprise</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
