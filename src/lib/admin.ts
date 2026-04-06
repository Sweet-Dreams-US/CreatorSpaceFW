export const ADMIN_EMAILS = [
  "cole@sweetdreamsmusic.com",
  "cole@sweetdreams.us",
  "zach@topspheremedia.com",
  "zach@topsphere.com",
];

// Full admin check — email whitelist (legacy) OR role = 'admin' in DB
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Check if user has moderator-level access (admin OR board)
// This is used for gating the admin panel and content moderation
export function hasModeratorAccess(role: string | null | undefined): boolean {
  return role === "admin" || role === "board";
}

// Check if user is specifically a board member (not full admin)
export function isBoard(role: string | null | undefined): boolean {
  return role === "board";
}

// Check if user has full admin access (not board)
// Board members cannot: manage roles, send invites/announcements, access settings
export function isFullAdmin(email: string | undefined | null, role: string | null | undefined): boolean {
  return isAdmin(email) || role === "admin";
}
