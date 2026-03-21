export const ADMIN_EMAILS = [
  "cole@sweetdreamsmusic.com",
  "cole@sweetdreams.us",
  "zach@topspheremedia.com",
  "zach@topsphere.com",
];

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
