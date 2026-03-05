export const ADMIN_EMAILS = [
  "cole@sweetdreamsmusic.com",
  "zach@topspheremedia.com",
];

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
