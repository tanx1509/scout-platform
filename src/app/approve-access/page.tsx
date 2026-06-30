import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";
import { approveUserAction } from "./actions";

export default async function ApproveAccessPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  
  if (!token) {
    return <ErrorState message="Invalid or missing token." />;
  }

  let userId = "";
  try {
    const decoded = jwt.verify(token, process.env.AUTH_SECRET || "secret") as { userId: string };
    userId = decoded.userId;
  } catch (error) {
    return <ErrorState message="This approval link has expired or is invalid." />;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return <ErrorState message="User not found." />;
  }

  if (user.role !== "PENDING") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="mb-2 text-xl font-bold">Access Already Provisioned</h2>
          <p className="text-sm text-zinc-500">This user is currently assigned the role of <strong>{user.role}</strong>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-xl font-bold">Provision Workspace Access</h2>
          <p className="mt-1 text-sm text-zinc-500">Assign a role to grant access to Scout.</p>
        </div>
        
        <div className="p-6">
          <div className="mb-6 space-y-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Name</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.name || "Unknown"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Email</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{user.email || "Unknown"}</span>
            </div>
          </div>

          <form action={approveUserAction}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="token" value={token} />
            
            <div className="mb-6 space-y-2">
              <label htmlFor="role" className="text-sm font-medium">Select Role</label>
              <select 
                id="role" 
                name="role" 
                defaultValue="RECRUITER"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="RECRUITER">Recruiter</option>
                <option value="HIRING_MANAGER">Hiring Manager</option>
                <option value="INTERVIEWER">Interviewer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
            >
              Approve & Grant Access
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-900 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
        <h2 className="mb-2 text-lg font-semibold">Access Error</h2>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
