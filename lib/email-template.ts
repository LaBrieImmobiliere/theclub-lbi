/**
 * Premium email template for The Club - La Brie Immobilière
 *
 * Design "dark-first" pour survivre au dark mode de Gmail iOS/Android,
 * qui ignore les meta color-scheme. En rendant le header + le titre
 * déjà sombres, Gmail ne peut plus inverser ces zones en quelque chose
 * de laid. Le body reste clair pour la lisibilité du texte long.
 */

const COLORS = {
  deep: "#030A24",
  navy: "#1a2744",
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
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style type="text/css">
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    /* Gmail app dark mode : force les bons backgrounds sur les sections sombres */
    [data-ogsc] .lbi-dark,
    [data-ogsb] .lbi-dark { background-color: #030A24 !important; color: #ffffff !important; }
    [data-ogsc] .lbi-dark p,
    [data-ogsb] .lbi-dark p,
    [data-ogsc] .lbi-dark span,
    [data-ogsb] .lbi-dark span { color: #ffffff !important; }
    [data-ogsc] .lbi-dark .lbi-gold,
    [data-ogsb] .lbi-dark .lbi-gold { color: #D1B280 !important; }
    [data-ogsc] .lbi-body,
    [data-ogsb] .lbi-body { background-color: #ffffff !important; color: #374151 !important; }
    @media (prefers-color-scheme: dark) {
      .lbi-dark { background-color: #030A24 !important; color: #ffffff !important; }
      .lbi-body { background-color: #ffffff !important; color: #374151 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLORS.deep};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#030A24;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.deep};padding:0;" bgcolor="${COLORS.deep}" class="lbi-dark">
    <tr><td align="center" style="padding:30px 0;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;" bgcolor="${COLORS.deep}">

        <!-- HEADER (logo + branding + TITLE intégré) -->
        <tr>
          <td class="lbi-dark" align="center" style="background:${COLORS.deep};padding:44px 40px 24px;" bgcolor="${COLORS.deep}">
            <img src="${appUrl}/logo-white.png" alt="La Brie Immobilière" width="160" height="160" style="display:block;width:160px;height:160px;margin:0 auto 14px;" />
            <p class="lbi-gold" style="color:${COLORS.gold};font-size:12px;letter-spacing:5px;margin:0 0 4px;text-transform:uppercase;font-weight:600;font-family:Arial,sans-serif;">The Club</p>
            <p style="color:#ffffff;font-size:11px;letter-spacing:1px;margin:0 0 26px;font-family:Arial,sans-serif;opacity:0.65;">La Brie Immobilière &middot; depuis 1969</p>
            <!-- Gold accent bar -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr>
              <td style="background:${COLORS.gold};height:2px;width:60px;font-size:0;line-height:0;" bgcolor="${COLORS.gold}">&nbsp;</td>
            </tr></table>
            <!-- Titre intégré au header sombre (plus de barre cream qui s'inverse sur Gmail) -->
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;font-family:'Fira Sans',Arial,sans-serif;line-height:1.3;">${title}</p>
          </td>
        </tr>

        <!-- BODY (le seul bloc clair, pour lisibilité du contenu long) -->
        <tr>
          <td class="lbi-body" style="padding:34px 40px 30px;background:${COLORS.white};" bgcolor="${COLORS.white}">
            <p style="color:${COLORS.deep};font-size:16px;line-height:1.65;margin:0 0 20px;font-weight:500;font-family:Arial,sans-serif;">
              ${greeting}
            </p>
            <div style="color:#374151;font-size:14px;line-height:1.75;font-family:Arial,sans-serif;">
              ${body}
            </div>
          </td>
        </tr>

        ${cta ? `
        <!-- CTA Button -->
        <tr>
          <td class="lbi-body" style="padding:0 40px 30px;background:${COLORS.white};" bgcolor="${COLORS.white}">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center">
                <a href="${cta.url}" style="display:inline-block;background:${COLORS.deep};color:${COLORS.gold};text-decoration:none;padding:15px 42px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;border:1px solid ${COLORS.gold};">
                  ${cta.label}
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        ` : ""}

        ${footer ? `
        <!-- Additional info (note) -->
        <tr>
          <td class="lbi-body" style="padding:0 40px 30px;background:${COLORS.white};" bgcolor="${COLORS.white}">
            <div style="background:${COLORS.cream};border-left:3px solid ${COLORS.gold};padding:14px 20px;font-size:13px;color:${COLORS.gray};line-height:1.6;font-family:Arial,sans-serif;">
              ${footer}
            </div>
          </td>
        </tr>
        ` : ""}

        <!-- FOOTER (navy, assorti au header) -->
        <tr>
          <td class="lbi-dark" style="background:${COLORS.deep};padding:28px 40px;text-align:center;" align="center" bgcolor="${COLORS.deep}">
            <p class="lbi-gold" style="color:${COLORS.gold};font-size:11px;letter-spacing:3px;margin:0 0 6px;text-transform:uppercase;font-weight:600;font-family:Arial,sans-serif;">La Brie Immobilière</p>
            <p style="color:#ffffff;font-size:10px;margin:0 0 16px;font-family:Arial,sans-serif;opacity:0.5;">depuis 1969</p>
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="padding:0 8px;"><a href="${appUrl}" style="color:${COLORS.gold};font-size:11px;text-decoration:none;font-family:Arial,sans-serif;">Accéder à l'app</a></td>
              <td style="color:#ffffff;opacity:0.25;">|</td>
              <td style="padding:0 8px;"><a href="${appUrl}/mentions-legales" style="color:#ffffff;opacity:0.5;font-size:11px;text-decoration:none;font-family:Arial,sans-serif;">Mentions légales</a></td>
              <td style="color:#ffffff;opacity:0.25;">|</td>
              <td style="padding:0 8px;"><a href="${appUrl}/politique-confidentialite" style="color:#ffffff;opacity:0.5;font-size:11px;text-decoration:none;font-family:Arial,sans-serif;">Confidentialité</a></td>
            </tr></table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
