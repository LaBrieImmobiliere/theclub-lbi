import nodemailer from "nodemailer";
import path from "path";
import QRCode from "qrcode";
import { agency } from "./agency-config";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "pro1.mail.ovh.net",
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER || "",
    pass: process.env.EMAIL_SERVER_PASSWORD || "",
  },
});

import fs from "fs";

function findFile(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), `public/${filename}`),
    path.resolve(process.cwd(), `app-lbi/public/${filename}`),
    path.join(__dirname, `../public/${filename}`),
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch { /* skip */ }
  }
  return candidates[0];
}

const fromAddress = `"The Club - La Brie Immobilière" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`;

function pwaInstallBlock(appUrl: string): string {
  return `
  <!-- PWA INSTALL -->
  <tr>
    <td style="padding: 0 40px 30px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1; border-left: 3px solid #D1B280;">
        <tr>
          <td style="padding: 20px 25px;">
            <p style="margin:0 0 6px 0; font-size:13px; color:#888; text-transform:uppercase; letter-spacing:1px; font-weight:600; font-family: Arial, sans-serif;">&#128241; Installez l&apos;application</p>
            <p style="margin:0 0 12px 0; font-size:14px; color:#333; line-height:1.6; font-family: Arial, sans-serif;">
              Pour recommander rapidement depuis votre mobile, installez <strong>The Club</strong> sur votre écran d&apos;accueil — aussi simple qu&apos;une application native.
            </p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:14px;">
              <tr>
                <td width="50%" style="padding-right:8px; vertical-align:top;">
                  <p style="margin:0 0 4px 0; font-size:12px; font-weight:700; color:#030A24; font-family: Arial, sans-serif;">Sur iPhone (Safari) :</p>
                  <p style="margin:0; font-size:12px; color:#666; line-height:1.5; font-family: Arial, sans-serif;">Appuyez sur &#8918; puis &laquo;&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;&raquo;</p>
                </td>
                <td width="50%" style="padding-left:8px; vertical-align:top;">
                  <p style="margin:0 0 4px 0; font-size:12px; font-weight:700; color:#030A24; font-family: Arial, sans-serif;">Sur Android (Chrome) :</p>
                  <p style="margin:0; font-size:12px; color:#666; line-height:1.5; font-family: Arial, sans-serif;">Menu &#8942; puis &laquo;&nbsp;Ajouter à l&apos;écran d&apos;accueil&nbsp;&raquo;</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center">
              <a href="${appUrl}" style="display:inline-block; background:#030A24; color:#D1B280; text-decoration:none; padding:10px 30px; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; font-family: Arial, sans-serif; border: 1px solid #D1B280;">
                &#128241; Ouvrir l&apos;application
              </a>
            </td></tr></table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  `;
}

interface NegotiatorInfo {
  name: string;
  email: string;
  phone?: string | null;
  agencyName: string;
  photo?: string | null;
}

export async function sendWelcomeEmail(to: string, name: string, password: string, role: string, negotiator?: NegotiatorInfo) {
  const { emailLayout } = await import("./email-template");
  const portalUrl = `${process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr"}`;
  const roleLabel = role === "NEGOTIATOR" ? "Négociateur" : "Ambassadeur";

  const negotiatorBlock = negotiator ? `
    <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
      <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Votre conseiller</p>
      <p style="margin:0;font-size:14px;color:#030A24;font-weight:bold;">${negotiator.name}</p>
      <p style="margin:3px 0 0;font-size:13px;color:#666;">${negotiator.agencyName}</p>
      ${negotiator.phone ? `<p style="margin:3px 0 0;font-size:13px;color:#666;">📞 ${negotiator.phone}</p>` : ""}
      <p style="margin:3px 0 0;font-size:13px;color:#666;">✉️ ${negotiator.email}</p>
    </div>
  ` : "";

  const html = emailLayout({
    preheader: `Bienvenue sur The Club ! Votre espace ${roleLabel.toLowerCase()} est prêt.`,
    title: `Bienvenue ${name} !`,
    greeting: `Félicitations ! Votre espace ${roleLabel.toLowerCase()} a été créé sur The Club — La Brie Immobilière.`,
    body: `
      <p style="margin:0 0 15px;">Vous faites désormais partie de notre réseau de partenaires privilégiés.</p>

      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Vos identifiants</p>
        <p style="margin:0;font-size:14px;color:#030A24;"><strong>Email :</strong> ${to}</p>
        <p style="margin:5px 0 0;font-size:14px;color:#030A24;"><strong>Mot de passe :</strong> ${password}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#999;font-style:italic;">Pensez à modifier votre mot de passe lors de votre première connexion.</p>
      </div>

      ${negotiatorBlock}

      <p style="margin:15px 0 0;font-size:13px;color:#666;">💡 <strong>Conseil :</strong> Recommandez vos proches ayant un projet immobilier et touchez 5% de commission sur chaque transaction aboutie !</p>
    `,
    cta: { label: "Accéder à mon espace", url: portalUrl },
    footer: "📱 Installez l'app sur votre téléphone : ouvrez le lien dans Safari (iPhone) ou Chrome (Android), puis « Ajouter à l'écran d'accueil ».",
  });

  // Legacy variables kept for compatibility
  const tips = [
    "Pensez à votre entourage.",
    "Le timing est clé.",
    "5% des honoraires par transaction.",
  ];

  void tips; // kept for backward compat
  // Legacy HTML removed — using emailLayout above

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Bienvenue sur The Club : La Brie Immobilière — Votre espace ${roleLabel}`,
      html,
      attachments: [
        {
          filename: "logo.png",
          path: findFile("logo-white.png"),
          cid: "logo",
        },
        ...(negotiator?.photo ? [{
          filename: "negotiator.jpg",
          path: findFile(negotiator.photo.replace(/^\//, "")),
          cid: "negphoto",
        }] : []),
      ],
    });
    console.log(`[email] Welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send welcome email:", error);
    return false;
  }
}

export async function sendNewLeadEmail(to: string, ambassadorName: string, leadName: string, leadType: string) {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding: 30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; max-width:600px;">

  <tr>
    <td align="center" style="background:#030A24; padding: 25px 40px; text-align: center;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td align="center">
        <img src="cid:logo" alt="La Brie Immobilière" width="140" height="140" style="display:block; width:140px; height:140px; margin:0 auto 10px auto; border:0;" />
      </td></tr></table>
      <p style="color:#D1B280; font-size:11px; letter-spacing:3px; margin:0; text-transform:uppercase; font-family: Arial, sans-serif;">The Club : La Brie Immobilière</p>
    </td>
  </tr>

  <tr>
    <td style="padding: 35px 40px 20px 40px;">
      <h1 style="color:#030A24; font-size:20px; margin:0 0 15px 0; font-family: 'Fira Sans', Arial, sans-serif;">
        &#127881; Nouvelle recommandation !
      </h1>
      <p style="color:#333; font-size:15px; line-height:1.7; margin:0; font-family: Arial, sans-serif;">
        Bonjour ${ambassadorName},<br/><br/>
        Bonne nouvelle ! <strong>${leadName}</strong> a soumis une demande de type <strong>${leadType}</strong> via votre lien de parrainage.
      </p>
    </td>
  </tr>

  <tr>
    <td style="padding: 0 40px 30px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4; border-left: 3px solid #22c55e;">
        <tr>
          <td style="padding: 20px;">
            <p style="margin:0; font-size:14px; color:#166534; font-family: Arial, sans-serif;">
              Notre équipe va contacter <strong>${leadName}</strong> dans les <strong>48 heures</strong>.
              Vous serez notifié de l'avancement dans votre espace.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="padding: 0 40px 35px 40px; text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/portail/mes-recommandations" style="display:inline-block; background:#D1B280; color:#ffffff; text-decoration:none; padding:14px 40px; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; font-family: Arial, sans-serif;">
        Voir mes recommandations
      </a>
    </td>
  </tr>

  <tr>
    <td style="background:#030A24; padding: 20px 40px; text-align: center;">
      <p style="color:#ffffff40; font-size:11px; margin:0; font-family: Arial, sans-serif;">
        ${agency.name} | ${agency.address}, ${agency.postalCode} ${agency.city} | ${agency.phone}
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Nouvelle recommandation : ${leadName} — The Club`,
      html,
      attachments: [{
        filename: "logo.png",
        path: findFile("logo-white.png"),
        cid: "logo",
      }],
    });
    return true;
  } catch (error) {
    console.error("[email] Failed to send new lead email:", error);
    return false;
  }
}

interface AgencyInfo {
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

export async function sendNegotiatorWelcomeEmail(
  to: string,
  name: string,
  password: string,
  code: string,
  agencyInfo: AgencyInfo
) {
  const portalUrl = `${process.env.NEXTAUTH_URL}/portail/tableau-de-bord`;
  const referralUrl = `${process.env.NEXTAUTH_URL}/rejoindre?ref=${code}`;

  // Generate QR code as base64 data URL
  const qrDataUrl = await QRCode.toDataURL(referralUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#030A24", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");

  const tips = [
    {
      icon: "&#128101;",
      title: "Parlez du programme à vos clients satisfaits",
      desc: "Après une vente ou un achat réussi, proposez-leur de recommander leurs proches. Un client heureux est votre meilleur ambassadeur.",
    },
    {
      icon: "&#128241;",
      title: "Partagez votre QR Code",
      desc: "Imprimez-le sur vos cartes de visite, affichez-le en agence ou envoyez-le par SMS. Chaque scan = un potentiel nouveau mandat.",
    },
    {
      icon: "&#128337;",
      title: "Le bon timing fait tout",
      desc: "Un voisin qui déménage, un collègue qui investit, un ami qui divorce… Soyez attentif aux signaux de projets immobiliers autour de vous.",
    },
    {
      icon: "&#127919;",
      title: "Suivez vos leads en temps réel",
      desc: "Depuis votre espace, visualisez chaque recommandation, son statut et vos commissions. Relancez au bon moment.",
    },
    {
      icon: "&#129309;",
      title: "Créez un réseau de confiance",
      desc: "Entretenez la relation avec vos ambassadeurs via la messagerie intégrée. Un ambassadeur informé recommande 3x plus.",
    },
    {
      icon: "&#128200;",
      title: "Fixez-vous un objectif",
      desc: "2 recommandations par mois = 24 prospects qualifiés par an. Chaque recommandation qui aboutit, c'est 5% d'honoraires pour vous.",
    },
  ];

  const tipsHtml = tips.map(t =>
    `<tr>
      <td style="padding: 12px 0; vertical-align: top; width: 32px; font-size: 20px; text-align: center;">${t.icon}</td>
      <td style="padding: 12px 0 12px 10px;">
        <p style="margin:0 0 3px 0; font-size:14px; font-weight:700; color:#030A24; font-family: Arial, sans-serif;">${t.title}</p>
        <p style="margin:0; font-size:13px; color:#666; line-height:1.5; font-family: Arial, sans-serif;">${t.desc}</p>
      </td>
    </tr>`
  ).join("");

  const agencyPhone = agencyInfo.phone || agency.phone;
  const agencyEmail = agencyInfo.email || agency.email;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding: 30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; max-width:600px;">

  <!-- HEADER -->
  <tr>
    <td align="center" style="background:#030A24; padding: 35px 40px; text-align: center;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td align="center">
        <img src="cid:logo" alt="La Brie Immobilière" width="200" height="200" style="display:block; width:200px; height:200px; margin:0 auto 15px auto; border:0;" />
      </td></tr></table>
      <p style="color:#D1B280; font-size:12px; letter-spacing:4px; margin:0 0 4px 0; text-transform:uppercase; font-family: Arial, sans-serif;">The Club</p>
      <p style="color:#ffffff; font-size:16px; margin:0; font-weight:bold; font-family: Arial, sans-serif;">La Brie Immobilière</p>
    </td>
  </tr>

  <!-- WELCOME -->
  <tr>
    <td style="padding: 40px 40px 15px 40px;">
      <h1 style="color:#030A24; font-size:24px; margin:0 0 8px 0; font-family: 'Fira Sans', Arial, sans-serif;">Bienvenue ${name} !</h1>
      <p style="color:#D1B280; font-size:13px; margin:0 0 4px 0; font-weight:600; text-transform:uppercase; letter-spacing:1px; font-family: Arial, sans-serif;">Négociateur</p>
      <p style="color:#888; font-size:13px; margin:0; font-family: Arial, sans-serif;">Agence de <strong style="color:#030A24;">${agencyInfo.name}</strong></p>
    </td>
  </tr>

  <!-- INTRO -->
  <tr>
    <td style="padding: 0 40px 25px 40px;">
      <p style="color:#333; font-size:15px; line-height:1.7; margin:0; font-family: Arial, sans-serif;">
        Vous intégrez le programme <strong>The Club</strong> en tant que négociateur rattaché à l'agence de <strong>${agencyInfo.name}</strong> (${agencyInfo.address}, ${agencyInfo.city}).
        Votre espace personnel est prêt : suivez vos recommandations, échangez avec vos ambassadeurs et développez votre réseau.
      </p>
    </td>
  </tr>

  <!-- CREDENTIALS -->
  <tr>
    <td style="padding: 0 40px 25px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1; border-left: 3px solid #D1B280;">
        <tr>
          <td style="padding: 25px 25px 10px 25px;">
            <p style="margin:0; font-size:13px; color:#888; text-transform:uppercase; letter-spacing:1px; font-weight:600; font-family: Arial, sans-serif;">Vos identifiants</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 25px 8px 25px;">
            <p style="margin:0; font-size:15px; color:#333; font-family: Arial, sans-serif;"><strong>Email :</strong> ${to}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 25px 20px 25px;">
            <p style="margin:0; font-size:15px; color:#333; font-family: Arial, sans-serif;"><strong>Mot de passe :</strong> ${password}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 25px 20px 25px;">
            <p style="margin:0; font-size:12px; color:#999; font-style:italic; font-family: Arial, sans-serif;">Pensez à modifier votre mot de passe lors de votre première connexion.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- REFERRAL CODE + QR CODE -->
  <tr>
    <td style="padding: 0 40px 30px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#030A24;">
        <tr>
          <td style="padding: 30px; text-align: center;">
            <p style="color:#D1B280; font-size:11px; letter-spacing:3px; margin:0 0 10px 0; text-transform:uppercase; font-family: Arial, sans-serif;">Votre code parrainage</p>
            <p style="color:#ffffff; font-size:28px; font-weight:700; margin:0 0 20px 0; letter-spacing:3px; font-family: 'Courier New', monospace;">${code}</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td align="center" style="background:#ffffff; padding:10px;">
              <img src="cid:qrcode" alt="QR Code parrainage" width="180" height="180" style="display:block; width:180px; height:180px; border:0;" />
            </td></tr></table>
            <p style="color:#ffffff80; font-size:11px; margin:15px 0 0 0; font-family: Arial, sans-serif;">
              Scannez ou partagez ce QR code — il renvoie directement vers votre lien de parrainage
            </p>
            <p style="color:#D1B280; font-size:12px; margin:8px 0 0 0; word-break:break-all; font-family: Arial, sans-serif;">
              <a href="${referralUrl}" style="color:#D1B280; text-decoration:underline;">${referralUrl}</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA BUTTON -->
  <tr>
    <td style="padding: 0 40px 35px 40px; text-align: center;">
      <a href="${portalUrl}" style="display:inline-block; background:#D1B280; color:#ffffff; text-decoration:none; padding:16px 50px; font-size:14px; font-weight:700; letter-spacing:2px; text-transform:uppercase; font-family: Arial, sans-serif;">
        Accéder à mon espace
      </a>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
    <td style="padding: 0 40px;">
      <hr style="border:none; border-top:1px solid #eee; margin:0;" />
    </td>
  </tr>

  <!-- TIPS SECTION -->
  <tr>
    <td style="padding: 30px 40px 10px 40px;">
      <h2 style="color:#030A24; font-size:18px; margin:0 0 5px 0; font-family: 'Fira Sans', Arial, sans-serif;">
        6 conseils pour développer votre réseau
      </h2>
      <p style="color:#888; font-size:13px; margin:0 0 15px 0; font-family: Arial, sans-serif;">
        Maximisez vos recommandations et vos commissions :
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding: 0 40px 30px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${tipsHtml}
      </table>
    </td>
  </tr>

  <!-- AGENCY INFO -->
  <tr>
    <td style="padding: 0 40px 30px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1; border-left: 3px solid #D1B280;">
        <tr>
          <td style="padding: 20px 25px;">
            <p style="margin:0 0 5px 0; font-size:13px; color:#888; text-transform:uppercase; letter-spacing:1px; font-weight:600; font-family: Arial, sans-serif;">Votre agence de rattachement</p>
            <p style="margin:0 0 3px 0; font-size:15px; color:#030A24; font-weight:700; font-family: Arial, sans-serif;">La Brie Immobilière — ${agencyInfo.name}</p>
            <p style="margin:0 0 3px 0; font-size:14px; color:#555; font-family: Arial, sans-serif;">${agencyInfo.address}, ${agencyInfo.city}</p>
            <p style="margin:0; font-size:14px; color:#555; font-family: Arial, sans-serif;">
              ${agencyPhone ? `&#9742; ${agencyPhone}` : ""}
              ${agencyPhone && agencyEmail ? " &nbsp;|&nbsp; " : ""}
              ${agencyEmail ? `<a href="mailto:${agencyEmail}" style="color:#D1B280; text-decoration:none;">${agencyEmail}</a>` : ""}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- QUOTE -->
  <tr>
    <td style="padding: 0 40px 35px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#030A24;">
        <tr>
          <td style="padding: 25px 30px; text-align:center;">
            <p style="color:#D1B280; font-size:15px; font-style:italic; margin:0 0 8px 0; line-height:1.5; font-family: Georgia, serif;">
              &laquo; Un négociateur qui active son réseau de recommandation transforme chaque client satisfait en source de nouveaux mandats. Le programme The Club est votre accélérateur de croissance. &raquo;
            </p>
            <p style="color:#ffffff60; font-size:12px; margin:0; font-family: Arial, sans-serif;">— La Direction, La Brie Immobilière</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  ${pwaInstallBlock(portalUrl)}

  <!-- FOOTER -->
  <tr>
    <td style="background:#030A24; padding: 25px 40px; text-align: center;">
      <p style="color:#D1B280; font-size:11px; margin:0 0 4px 0; letter-spacing:2px; text-transform:uppercase; font-family: Arial, sans-serif;">The Club : La Brie Immobilière</p>
      <p style="color:#ffffff40; font-size:11px; margin:0 0 3px 0; font-family: Arial, sans-serif;">
        ${agency.address}, ${agency.postalCode} ${agency.city}
      </p>
      <p style="color:#ffffff30; font-size:10px; margin:8px 0 0 0; font-family: Arial, sans-serif;">
        SIRET ${agency.siret} | RCS ${agency.rcs} ${agency.rcsNumber}
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Bienvenue ${name} — Négociateur à l'agence de ${agencyInfo.name} | The Club`,
      html,
      attachments: [
        {
          filename: "logo.png",
          path: findFile("logo-white.png"),
          cid: "logo",
        },
        {
          filename: "qrcode.png",
          content: Buffer.from(qrBase64, "base64"),
          cid: "qrcode",
        },
      ],
    });
    console.log(`[email] Negotiator welcome email sent to ${to} (agency: ${agencyInfo.name})`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send negotiator welcome email:", error);
    return false;
  }
}

export async function sendNotificationEmail(to: string, name: string, subject: string, message: string) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: message.substring(0, 100),
    title: subject,
    greeting: `Bonjour ${name},`,
    body: `<p style="margin:0 0 15px;">${message.replace(/\n/g, "<br/>")}</p>`,
    cta: { label: "Accéder à la plateforme", url: appUrl },
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      attachments: [{
        filename: "logo.png",
        path: findFile("logo-white.png"),
        cid: "logo",
      }],
    });
    return true;
  } catch (error) {
    console.error("[email] Failed to send notification email:", error);
    return false;
  }
}

export async function sendNewAmbassadorEmail(
  to: string,
  negotiatorName: string,
  ambassadorName: string,
  ambassadorEmail: string,
  ambassadorPhone: string | null,
  agencyName: string
) {
  const portalUrl = `${process.env.NEXTAUTH_URL}/portail/tableau-de-bord`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding: 30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; max-width:600px;">

  <!-- HEADER -->
  <tr>
    <td align="center" style="background:#030A24; padding: 30px 40px; text-align: center;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td align="center">
        <img src="cid:logo" alt="La Brie Immobilière" width="140" height="140" style="display:block; width:140px; height:140px; margin:0 auto 10px auto; border:0;" />
      </td></tr></table>
      <p style="color:#D1B280; font-size:11px; letter-spacing:3px; margin:0; text-transform:uppercase; font-family: Arial, sans-serif;">The Club : La Brie Immobilière</p>
    </td>
  </tr>

  <!-- TITLE -->
  <tr>
    <td style="padding: 35px 40px 15px 40px;">
      <h1 style="color:#030A24; font-size:22px; margin:0 0 8px 0; font-family: 'Fira Sans', Arial, sans-serif;">
        &#127881; Nouvel ambassadeur recruté !
      </h1>
      <p style="color:#888; font-size:13px; margin:0; font-family: Arial, sans-serif;">Agence de <strong style="color:#030A24;">${agencyName}</strong></p>
    </td>
  </tr>

  <!-- INTRO -->
  <tr>
    <td style="padding: 0 40px 25px 40px;">
      <p style="color:#333; font-size:15px; line-height:1.7; margin:0; font-family: Arial, sans-serif;">
        Bonjour <strong>${negotiatorName}</strong>,<br/><br/>
        Bonne nouvelle ! <strong>${ambassadorName}</strong> vient de s'inscrire comme ambassadeur via votre lien de parrainage.
        Votre réseau de recommandation grandit !
      </p>
    </td>
  </tr>

  <!-- AMBASSADOR CARD -->
  <tr>
    <td style="padding: 0 40px 25px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1; border-left: 3px solid #D1B280;">
        <tr>
          <td style="padding: 20px 25px;">
            <p style="margin:0 0 8px 0; font-size:13px; color:#888; text-transform:uppercase; letter-spacing:1px; font-weight:600; font-family: Arial, sans-serif;">Fiche ambassadeur</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding: 4px 0; width: 30px; vertical-align: top; font-size: 16px;">&#128100;</td>
                <td style="padding: 4px 0; font-size:15px; color:#030A24; font-weight:700; font-family: Arial, sans-serif;">${ambassadorName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; width: 30px; vertical-align: top; font-size: 16px;">&#9993;</td>
                <td style="padding: 4px 0; font-size:14px; color:#555; font-family: Arial, sans-serif;">
                  <a href="mailto:${ambassadorEmail}" style="color:#D1B280; text-decoration:none;">${ambassadorEmail}</a>
                </td>
              </tr>
              ${ambassadorPhone ? `
              <tr>
                <td style="padding: 4px 0; width: 30px; vertical-align: top; font-size: 16px;">&#128222;</td>
                <td style="padding: 4px 0; font-size:14px; color:#555; font-family: Arial, sans-serif;">${ambassadorPhone}</td>
              </tr>
              ` : ""}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- TIPS -->
  <tr>
    <td style="padding: 0 40px 25px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#030A24;">
        <tr>
          <td style="padding: 25px 30px;">
            <p style="color:#D1B280; font-size:13px; font-weight:700; margin:0 0 12px 0; text-transform:uppercase; letter-spacing:1px; font-family: Arial, sans-serif;">
              &#128161; Comment maximiser ce recrutement
            </p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding: 6px 0; color:#D1B280; font-size:14px; vertical-align:top; width:20px;">1.</td>
                <td style="padding: 6px 0; color:#ffffff; font-size:13px; line-height:1.5; font-family: Arial, sans-serif;">
                  <strong>Prenez contact rapidement</strong> — envoyez un message de bienvenue à ${ambassadorName} via la messagerie de l'application.
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color:#D1B280; font-size:14px; vertical-align:top; width:20px;">2.</td>
                <td style="padding: 6px 0; color:#ffffff; font-size:13px; line-height:1.5; font-family: Arial, sans-serif;">
                  <strong>Expliquez le programme</strong> — rappelez que chaque recommandation aboutie génère 5% de commission pour l'ambassadeur.
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color:#D1B280; font-size:14px; vertical-align:top; width:20px;">3.</td>
                <td style="padding: 6px 0; color:#ffffff; font-size:13px; line-height:1.5; font-family: Arial, sans-serif;">
                  <strong>Restez disponible</strong> — un ambassadeur bien accompagné recommande 3 fois plus qu'un ambassadeur laissé sans nouvelle.
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color:#D1B280; font-size:14px; vertical-align:top; width:20px;">4.</td>
                <td style="padding: 6px 0; color:#ffffff; font-size:13px; line-height:1.5; font-family: Arial, sans-serif;">
                  <strong>Relancez régulièrement</strong> — un petit message tous les mois pour rappeler le programme suffit à maintenir l'engagement.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding: 0 40px 35px 40px; text-align: center;">
      <a href="${portalUrl}" style="display:inline-block; background:#D1B280; color:#ffffff; text-decoration:none; padding:14px 40px; font-size:13px; font-weight:700; letter-spacing:1px; text-transform:uppercase; font-family: Arial, sans-serif;">
        Voir mon tableau de bord
      </a>
    </td>
  </tr>

  <!-- STATS REMINDER -->
  <tr>
    <td style="padding: 0 40px 30px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 0 40px;">
            <hr style="border:none; border-top:1px solid #eee; margin:0;" />
          </td>
        </tr>
      </table>
      <p style="color:#888; font-size:13px; line-height:1.6; margin:15px 0 0 0; text-align:center; font-family: Arial, sans-serif;">
        Consultez votre espace pour suivre votre réseau d'ambassadeurs,<br/>
        vos recommandations et vos commissions en temps réel.
      </p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#030A24; padding: 20px 40px; text-align: center;">
      <p style="color:#D1B280; font-size:11px; margin:0 0 4px 0; letter-spacing:2px; text-transform:uppercase; font-family: Arial, sans-serif;">The Club : La Brie Immobilière</p>
      <p style="color:#ffffff40; font-size:11px; margin:0; font-family: Arial, sans-serif;">
        ${agency.address}, ${agency.postalCode} ${agency.city} | ${agency.phone}
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Nouvel ambassadeur recruté : ${ambassadorName} — The Club`,
      html,
      attachments: [{
        filename: "logo.png",
        path: findFile("logo-white.png"),
        cid: "logo",
      }],
    });
    console.log(`[email] New ambassador email sent to ${to} (ambassador: ${ambassadorName})`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send new ambassador email:", error);
    return false;
  }
}
