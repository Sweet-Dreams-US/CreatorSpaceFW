import { Resend } from "resend";

// Lazy-init to avoid build errors when RESEND_API_KEY isn't set
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://creatorspacefw.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "Creator Space Fort Wayne <hello@creatorspacefw.com>";

export async function sendInviteEmail(
  to: string,
  firstName: string,
  inviteToken: string
) {
  const signupUrl = `${SITE_URL}/auth/signup?token=${inviteToken}&email=${encodeURIComponent(to)}`;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${firstName}, claim your Creator Space profile`,
    html: buildInviteHtml(firstName, signupUrl),
  });
}

export async function sendAnnouncementEmail(
  to: string,
  firstName: string,
  subject: string,
  body: string
) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: buildAnnouncementHtml(firstName, subject, body),
  });
}

function buildInviteHtml(firstName: string, signupUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 0;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:bold;color:#fafafa;letter-spacing:2px;">
                CREATOR SPACE<br>FORT WAYNE
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#141414;border-radius:12px;padding:40px 32px;border:1px solid #2a2a2a;">
              <p style="margin:0 0 20px;font-size:16px;color:#fafafa;">
                Hey ${firstName},
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#cccccc;line-height:1.6;">
                You're already in the Creator Space Fort Wayne database. We built a profile for you — now it's time to claim it, customize it, and make it yours.
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#cccccc;line-height:1.6;">
                Click below to create your account and claim your profile. Your existing info (name, skills, company) will be preserved.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${signupUrl}" style="display:inline-block;background-color:#fa9277;color:#0a0a0a;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:100px;letter-spacing:1px;">
                      CLAIM YOUR PROFILE
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:32px 0 0;font-size:12px;color:#888888;line-height:1.6;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${signupUrl}" style="color:#fa9277;word-break:break-all;">${signupUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#888888;">
                Creator Space Fort Wayne — Free monthly meetups for Fort Wayne creators
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendInquiryNotification(inquiry: {
  business_name: string;
  contact_name: string;
  email: string;
  project_description: string;
  creator_types: string[];
}) {
  const { ADMIN_EMAILS } = await import("@/lib/admin");
  const results = await Promise.allSettled(
    ADMIN_EMAILS.map((adminEmail) =>
      getResend().emails.send({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `New Hire Request: ${inquiry.business_name}`,
        html: buildInquiryHtml(inquiry),
      })
    )
  );
  return results;
}

function buildInquiryHtml(inquiry: {
  business_name: string;
  contact_name: string;
  email: string;
  project_description: string;
  creator_types: string[];
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:32px 0;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:bold;color:#fafafa;letter-spacing:2px;">NEW HIRE REQUEST</h1>
          <p style="margin:8px 0 0;font-size:14px;color:#fa9277;letter-spacing:4px;">CREATOR SPACE FW</p>
        </td></tr>
        <tr><td style="background-color:#141414;border-radius:12px;padding:40px 32px;border:1px solid #2a2a2a;">
          <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Business</p>
          <p style="margin:0 0 20px;font-size:16px;color:#fafafa;">${inquiry.business_name}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Contact</p>
          <p style="margin:0 0 20px;font-size:14px;color:#ccc;">${inquiry.contact_name} — <a href="mailto:${inquiry.email}" style="color:#fa9277;">${inquiry.email}</a></p>
          <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Looking for</p>
          <p style="margin:0 0 20px;font-size:14px;color:#9dfa77;">${inquiry.creator_types.join(", ")}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;">Project</p>
          <p style="margin:0;font-size:14px;color:#ccc;line-height:1.6;">${inquiry.project_description.replace(/\n/g, "<br>")}</p>
        </td></tr>
        <tr><td style="padding:24px 0;text-align:center;">
          <a href="${SITE_URL}/admin/inquiries" style="display:inline-block;background-color:#fa9277;color:#0a0a0a;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:100px;letter-spacing:1px;">VIEW IN ADMIN</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendSpotlightEmail(
  to: string,
  firstName: string,
  spotlightCreatorName: string,
  spotlightSlug: string
) {
  const profileUrl = `${SITE_URL}/directory/${spotlightSlug}`;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${spotlightCreatorName} is this month's Creator of the Month`,
    html: buildSpotlightHtml(firstName, spotlightCreatorName, profileUrl),
  });
}

function buildSpotlightHtml(
  firstName: string,
  spotlightCreatorName: string,
  profileUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 0;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:bold;color:#fafafa;letter-spacing:2px;">
                CREATOR SPACE<br>FORT WAYNE
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#141414;border-radius:12px;padding:40px 32px;border:1px solid #2a2a2a;">
              <p style="margin:0 0 8px;font-size:12px;color:#fa9277;text-transform:uppercase;letter-spacing:4px;text-align:center;">
                CREATOR OF THE MONTH
              </p>
              <h2 style="margin:0 0 24px;font-size:24px;font-weight:bold;color:#fafafa;text-align:center;">
                ${spotlightCreatorName}
              </h2>
              <p style="margin:0 0 20px;font-size:16px;color:#fafafa;">
                Hey ${firstName},
              </p>
              <p style="margin:0 0 20px;font-size:14px;color:#cccccc;line-height:1.6;">
                We're excited to announce that <strong style="color:#fafafa;">${spotlightCreatorName}</strong> has been selected as this month's Creator Spotlight. Check out their profile to see what they've been working on and connect with them.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:12px 0 0;">
                    <a href="${profileUrl}" style="display:inline-block;background-color:#fa9277;color:#0a0a0a;font-size:14px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:100px;letter-spacing:1px;">
                      VIEW THEIR PROFILE
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#888888;">
                Creator Space Fort Wayne — Free monthly meetups for Fort Wayne creators
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAnnouncementHtml(firstName: string, subject: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:32px 0;text-align:center;">
              <h1 style="margin:0;font-size:28px;font-weight:bold;color:#fafafa;letter-spacing:2px;">
                CREATOR SPACE<br>FORT WAYNE
              </h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#141414;border-radius:12px;padding:40px 32px;border:1px solid #2a2a2a;">
              <p style="margin:0 0 8px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:1px;">
                ${subject}
              </p>
              <p style="margin:0 0 20px;font-size:16px;color:#fafafa;">
                Hey ${firstName},
              </p>
              <div style="font-size:14px;color:#cccccc;line-height:1.8;">
                ${body.replace(/\n/g, "<br>")}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#888888;">
                Creator Space Fort Wayne — Free monthly meetups for Fort Wayne creators
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
