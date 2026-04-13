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
    });
    console.log(`[email] Welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send welcome email:", error);
    return false;
  }
}

export async function sendNewLeadEmail(to: string, ambassadorName: string, leadName: string, leadType: string) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Nouvelle recommandation : ${leadName}`,
    title: "Nouvelle recommandation ! 🎉",
    greeting: `Bonjour,`,
    body: `
      <p style="margin:0 0 15px;">Un ambassadeur vient de soumettre une nouvelle recommandation.</p>
      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Recommandation</p>
        <p style="margin:0;font-size:15px;color:#030A24;font-weight:bold;">${leadName}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Type :</strong> ${leadType}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Ambassadeur :</strong> ${ambassadorName}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;">Notre équipe va contacter ${leadName} dans les 48 heures.</p>
    `,
    cta: { label: "Traiter la recommandation", url: `${appUrl}/admin/recommandations` },
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject: `Nouvelle recommandation : ${leadName} — The Club`, html });
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


export async function sendNotificationEmail(to: string, name: string, subject: string, message: string) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: message.substring(0, 100),
    title: subject,
    greeting: `Bonjour ${name},`,
    body: `<div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:0 0 15px;"><p style="margin:0;font-size:14px;color:#030A24;line-height:1.7;">${message.replace(/\n/g, "<br/>")}</p></div>`,
    cta: { label: "Accéder à la plateforme", url: appUrl },
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject, html });
    return true;
  } catch (error) {
    console.error("[email] Failed to send notification email:", error);
    return false;
  }
}


export async function sendRibReminderEmail(to: string, name: string, contractNumber: string) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Ajoutez votre RIB pour recevoir vos commissions`,
    title: "Contrat signé — ajoutez votre RIB",
    greeting: `Bonjour ${name},`,
    body: `
      <p style="margin:0 0 15px;font-size:14px;color:#030A24;line-height:1.7;">
        Votre contrat <strong>${contractNumber}</strong> a bien été signé. Merci !
      </p>
      <div style="background:#FEF3C7;border-left:3px solid #D97706;padding:15px 20px;margin:0 0 20px;">
        <p style="margin:0 0 5px;font-size:12px;color:#92400E;text-transform:uppercase;letter-spacing:1px;font-weight:600;">&#9888;&#65039; Action requise</p>
        <p style="margin:0;font-size:14px;color:#78350F;line-height:1.6;">
          Pour recevoir vos commissions, vous devez renseigner votre <strong>RIB (IBAN)</strong> dans votre espace personnel.
        </p>
      </div>
      <p style="margin:0 0 15px;font-size:13px;color:#666;line-height:1.6;">
        Sans RIB enregistré, nous ne pourrons pas procéder au versement de vos commissions.
        Cliquez sur le bouton ci-dessous pour l'ajouter en quelques secondes.
      </p>
    `,
    cta: { label: "Ajouter mon RIB", url: `${appUrl}/portail/profil` },
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject: `Contrat ${contractNumber} signé — Ajoutez votre RIB | The Club`, html });
    console.log(`[email] RIB reminder sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send RIB reminder:", error);
    return false;
  }
}

export async function sendRibAddedNotification(ambassadorName: string, ambassadorEmail: string, iban: string) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";
  const maskedIban = iban.substring(0, 4) + " **** **** " + iban.substring(iban.length - 4);

  const html = emailLayout({
    preheader: `${ambassadorName} a renseigné son RIB`,
    title: "RIB ajouté par un ambassadeur",
    greeting: `Bonjour,`,
    body: `
      <p style="margin:0 0 15px;font-size:14px;color:#030A24;line-height:1.7;">
        Un ambassadeur vient de renseigner ses coordonnées bancaires.
      </p>
      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:0 0 20px;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Ambassadeur</p>
        <p style="margin:0;font-size:15px;color:#030A24;font-weight:bold;">${ambassadorName}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Email :</strong> ${ambassadorEmail}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>IBAN :</strong> ${maskedIban}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
        Vous pouvez consulter la fiche de cet ambassadeur pour vérifier les informations.
      </p>
    `,
    cta: { label: "Voir les ambassadeurs", url: `${appUrl}/admin/ambassadeurs` },
  });

  // Send to all admin users
  const { prisma } = await import("./prisma");
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });

  for (const admin of admins) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: admin.email,
        subject: `RIB ajouté : ${ambassadorName} — The Club`,
        html,
      });
    } catch (error) {
      console.error(`[email] Failed to send RIB notification to ${admin.email}:`, error);
    }
  }
  console.log(`[email] RIB added notification sent to ${admins.length} admin(s)`);
  return true;
}

export async function sendNegotiatorWelcomeEmail(
  to: string,
  name: string,
  password: string,
  code: string,
  agencyInfo: { name: string; address: string; city: string; postalCode?: string; phone?: string; email?: string }
) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Bienvenue ${name} ! Votre espace négociateur est prêt.`,
    title: `Bienvenue ${name} !`,
    greeting: `Félicitations ! Votre espace négociateur a été créé sur The Club — La Brie Immobilière.`,
    body: `
      <p style="margin:0 0 15px;">Vous intégrez le programme The Club en tant que négociateur rattaché à l'agence de <strong>${agencyInfo.name}</strong>.</p>

      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Vos identifiants</p>
        <p style="margin:0;font-size:14px;color:#030A24;"><strong>Email :</strong> ${to}</p>
        <p style="margin:5px 0 0;font-size:14px;color:#030A24;"><strong>Mot de passe :</strong> ${password}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#999;font-style:italic;">Pensez à modifier votre mot de passe.</p>
      </div>

      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Votre agence</p>
        <p style="margin:0;font-size:15px;color:#030A24;font-weight:bold;">${agencyInfo.name}</p>
        <p style="margin:3px 0 0;font-size:13px;color:#666;">${agencyInfo.address}, ${agencyInfo.city}</p>
        <p style="margin:3px 0 0;font-size:13px;color:#666;">Code recrutement : <strong>${code}</strong></p>
      </div>

      <p style="margin:15px 0 0;font-size:13px;color:#666;">🔗 Partagez votre code pour recruter des ambassadeurs.</p>
    `,
    cta: { label: "Accéder à mon espace", url: `${appUrl}/negociateur/tableau-de-bord` },
    footer: "📱 Installez l'app : Safari → Partager → Sur l'écran d'accueil",
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject: `Bienvenue ${name} — Négociateur | The Club`, html });
    console.log(`[email] Negotiator welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send negotiator welcome email:", error);
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
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Nouvel ambassadeur : ${ambassadorName}`,
    title: "Nouvel ambassadeur recruté ! 🎉",
    greeting: `Bonjour ${negotiatorName},`,
    body: `
      <p style="margin:0 0 15px;">Un nouvel ambassadeur vient de rejoindre votre réseau via votre lien de recrutement.</p>
      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Nouvel ambassadeur</p>
        <p style="margin:0;font-size:15px;color:#030A24;font-weight:bold;">${ambassadorName}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Email :</strong> ${ambassadorEmail}</p>
        ${ambassadorPhone ? `<p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Téléphone :</strong> ${ambassadorPhone}</p>` : ""}
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Agence :</strong> ${agencyName}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;">Vous pouvez échanger avec votre nouvel ambassadeur depuis la messagerie.</p>
    `,
    cta: { label: "Voir mes ambassadeurs", url: `${appUrl}/negociateur/mes-ambassadeurs` },
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject: `Nouvel ambassadeur recruté : ${ambassadorName} — The Club`, html });
    console.log(`[email] New ambassador email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send new ambassador email:", error);
    return false;
  }
}
