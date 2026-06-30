import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { LandingClient } from "@/components/landing/landing-client";

export default async function LandingPage() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  const providers = {
    demoMode: process.env.DEMO_MODE === 'true',
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "demo-google-client-id" && process.env.GOOGLE_CLIENT_ID.trim() !== ""),
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID.trim() !== ""),
    microsoft: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_ID.trim() !== ""),
  };

  return <LandingClient providers={providers} />;
}
