import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const providers = [
  // ─── Demo Credentials (only available in DEMO_MODE) ──────────────────────
  ...(process.env.DEMO_MODE === 'true'
    ? [
        CredentialsProvider({
          id: "demo-credentials",
          name: "Demo Login",
          credentials: {
            email: { label: "Email", type: "email", placeholder: "demo@scout.ai" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            if (credentials?.password === "demo") {
              return {
                id: "demo-user-001",
                name: "Demo Recruiter",
                email: (credentials.email as string) || "demo@scout.ai",
                role: "ADMIN",
              };
            }
            return null;
          },
        }),
      ]
    : []),

  // ─── Google OAuth (only when real credentials are present) ─────────────────
  ...(process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== "demo-google-client-id" &&
  process.env.GOOGLE_CLIENT_ID.trim() !== ""
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
];
