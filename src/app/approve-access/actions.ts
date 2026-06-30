"use server";

import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "@/lib/auth/audit";

export async function approveUserAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  const token = formData.get("token") as string;
  const newRole = formData.get("role") as string;

  if (!userId || !token || !newRole) {
    throw new Error("Missing required fields.");
  }

  // Validate the token to ensure the request is authorized
  try {
    jwt.verify(token, process.env.AUTH_SECRET || "secret");
  } catch (error) {
    throw new Error("Invalid or expired token.");
  }

  // Ensure role is valid
  if (!["RECRUITER", "HIRING_MANAGER", "INTERVIEWER", "ADMIN"].includes(newRole)) {
    throw new Error("Invalid role selection.");
  }

  // Update the user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole as any },
  });

  // Log the audit
  await logAudit(userId, `ROLE_GRANTED`);

  // Redirect to a success page or login
  redirect("/?approved=true");
}
