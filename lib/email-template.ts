/**
 * Premium email template for The Club - La Brie Immobilière
 * Consistent branding across all transactional emails
 */

const COLORS = {
  deep: "#030A24",
  gold: "#D1B280",
  goldDark: "#b89a65",
  cream: "#f9f6f1",
  white: "#ffffff",
  gray: "#6b7280",
  lightGray: "#f3f4f6",
};

export function emailLayout(options: {
  preheader?: string;
  title: string;
  greeting: string;
  body: string;
  cta?: { label: string; url: string };
  footer?: string;
}): string {
  const { preheader, title, greeting, body, cta, footer } = options;
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${preheader ? `<span style="display:none!important;font-size:1px;color:${COLORS.deep};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;background:${COLORS.lightGray};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.lightGray};padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.white};border-radius:0;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td align="center" style="background:#1a2744;padding:40px 40px 30px;">
            <img src="${appUrl}/logo-white.png" alt="La Brie Immobilière" width="180" height="180" style="display:block;width:180px;height:180px;margin:0 auto 16px;" />
            <p style="color:${COLORS.gold};font-size:13px;letter-spacing:5px;margin:0 0 4px;text-transform:uppercase;font-weight:600;font-family:Arial,sans-serif;">The Club</p>
            <p style="color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:1px;margin:0;font-family:Arial,sans-serif;">La Brie Immobilière</p>
          </td>
        </tr>

        <!-- Gold accent line -->
        <tr><td style="background:${COLORS.gold};height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Title bar -->
        <tr>
          <td style="background:${COLORS.cream};padding:22px 40px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-size:18px;font-weight:700;color:${COLORS.deep};font-family:'Fira Sans',Arial,sans-serif;">${title}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:30px 40px;">
            <p style="color:${COLORS.deep};font-size:16px;line-height:1.7;margin:0 0 20px;font-weight:500;font-family:Arial,sans-serif;">
              ${greeting}
            </p>
            <div style="color:#374151;font-size:14px;line-height:1.8;font-family:Arial,sans-serif;">
              ${body}
            </div>
          </td>
        </tr>

        ${cta ? `
        <!-- CTA Button -->
        <tr>
          <td style="padding:0 40px 30px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center">
                <a href="${cta.url}" style="display:inline-block;background:${COLORS.gold};color:${COLORS.white};text-decoration:none;padding:14px 40px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:Arial,sans-serif;">
                  ${cta.label}
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        ` : ""}

        ${footer ? `
        <!-- Additional info -->
        <tr>
          <td style="padding:0 40px 30px;">
            <div style="background:${COLORS.cream};border-left:3px solid ${COLORS.gold};padding:15px 20px;font-size:13px;color:${COLORS.gray};line-height:1.6;font-family:Arial,sans-serif;">
              ${footer}
            </div>
          </td>
        </tr>
        ` : ""}

        <!-- Footer -->
        <tr>
          <td style="background:#1a2744;padding:30px 40px;text-align:center;" align="center">
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
              <img src="${appUrl}/logo-white.png" alt="LBI" width="55" height="55" style="display:block;width:55px;height:55px;margin:0 auto 10px;opacity:0.7;" />
            </td></tr></table>
            <p style="color:${COLORS.gold};font-size:11px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;font-weight:600;font-family:Arial,sans-serif;">La Brie Immobilière</p>
            <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0 0 14px;font-family:Arial,sans-serif;">depuis 1969</p>
            <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="padding:0 8px;"><a href="${appUrl}" style="color:${COLORS.gold};font-size:11px;text-decoration:none;font-family:Arial,sans-serif;">Accéder à l'app</a></td>
                <td style="color:rgba(255,255,255,0.2);">|</td>
                <td style="padding:0 8px;"><a href="${appUrl}/mentions-legales" style="color:rgba(255,255,255,0.4);font-size:11px;text-decoration:none;font-family:Arial,sans-serif;">Mentions légales</a></td>
                <td style="color:rgba(255,255,255,0.2);">|</td>
                <td style="padding:0 8px;"><a href="${appUrl}/politique-confidentialite" style="color:rgba(255,255,255,0.4);font-size:11px;text-decoration:none;font-family:Arial,sans-serif;">Confidentialité</a></td>
              </tr></table>
            </td></tr></table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
