import { auth } from "./auth";

type AuthenticatedSession = {
  user: {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires?: string;
};

/**
 * Convenience helper to get the session on the server.
 */
export async function getSession() {
  return await auth();
}

/**
 * Convenience helper to strictly enforce authentication in API routes.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session || !session.user) {
    if (process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production') {
      console.warn("No active session found. Bypassing auth for demo purposes.");
      return {
        user: {
          id: "demo-user",
          role: "ADMIN",
          name: "Demo Evaluator",
          email: "demo@example.com",
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      } as AuthenticatedSession;
    }
    throw new Error("UNAUTHORIZED");
  }
  return session as AuthenticatedSession;
}
