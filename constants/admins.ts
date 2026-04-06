/** Email addresses allowed to see the DevPanel in production builds. */
export const ADMIN_EMAILS: readonly string[] = [
  "xwf2@cornell.edu",
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
