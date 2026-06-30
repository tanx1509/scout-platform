export type UserRole = "ADMIN" | "RECRUITER" | "PENDING";

export const PERMISSIONS = {
  ADMIN: ["*"],
  RECRUITER: ["read:candidates", "write:candidates", "read:jobs", "write:jobs", "read:matches", "write:matches", "upload:resume"],
  PENDING: []
};

export function hasPermission(role: UserRole | string, permission: string): boolean {
  const userRole = role as UserRole;
  if (!PERMISSIONS[userRole]) return false;
  
  if ((PERMISSIONS[userRole] as string[]).includes("*")) return true;
  return (PERMISSIONS[userRole] as string[]).includes(permission);
}
