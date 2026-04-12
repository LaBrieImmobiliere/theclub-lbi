import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import { emailLayout } from "./email-template";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "pro1.mail.ovh.net",
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER || "",
    pass: process.env.EMAIL_SERVER_PASSWORD || "",
  },
});

function findFile(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), `public/${filename}`),
    path.resolve(process.cwd(), `app-lbi/public/${filename}`),
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch { /* skip */ }
  }
  return candidates[0];
}

const fromAddress = `"The Club - La Brie Immobilière" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`;

/**
 * Send a premium branded email using the unified template
 */
export async function sendPremiumEmail(options: {
  to: string;
  subject: string;
  title: string;
  greeting: string;
  body: string;
  cta?: { label: string; url: string };
  footer?: string;
  preheader?: string;
}) {
  const html = emailLayout({
    preheader: options.preheader || options.subject,
    title: options.title,
    greeting: options.greeting,
    body: options.body,
    cta: options.cta,
    footer: options.footer,
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html,
      attachments: [{
        filename: "logo.png",
        path: findFile("logo-white.png"),
        cid: "logo",
      }],
    });
    return true;
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return false;
  }
}

/**
 * Send a test/preview of all email types to a given address
 */
export async function sendEmailPreview(to: string) {
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  // 1. Welcome
  await sendPremiumEmail({
    to,
    subject: "[PREVIEW] Email de bienvenue",
    title: "Bienvenue Alexandre !",
    greeting: "Félicitations ! Votre espace ambassadeur a été créé sur The Club — La Brie Immobilière.",
    body: `
      <p style="margin:0 0 15px;">Vous faites désormais partie de notre réseau de partenaires privilégiés.</p>
      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Vos identifiants</p>
        <p style="margin:0;font-size:14px;color:#030A24;"><strong>Email :</strong> ${to}</p>
        <p style="margin:5px 0 0;font-size:14px;color:#030A24;"><strong>Mot de passe :</strong> Abc12345</p>
      </div>
      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Votre conseiller</p>
        <p style="margin:0;font-size:14px;color:#030A24;font-weight:bold;">Alexandre BRITES</p>
        <p style="margin:3px 0 0;font-size:13px;color:#666;">Brie Comte Robert</p>
        <p style="margin:3px 0 0;font-size:13px;color:#666;">📞 06 24 43 66 94</p>
      </div>
      <p style="margin:15px 0 0;font-size:13px;color:#666;">💡 Recommandez vos proches et touchez 5% de commission !</p>
    `,
    cta: { label: "Accéder à mon espace", url: appUrl },
    footer: "📱 Installez l'app : Safari → Partager → Sur l'écran d'accueil",
  });

  // 2. Notification - Nouveau message
  await sendPremiumEmail({
    to,
    subject: "[PREVIEW] Nouveau message",
    title: "Nouveau message",
    greeting: "Bonjour Alexandre,",
    body: `<p style="margin:0;">Angela BRITES vous a envoyé un message sur la plateforme The Club.<br/>Connectez-vous pour le lire et y répondre.</p>`,
    cta: { label: "Ouvrir la messagerie", url: `${appUrl}/portail/messagerie` },
  });

  // 3. Notification - Changement statut lead (fun style)
  await sendPremiumEmail({
    to,
    subject: "[PREVIEW] Champagne ! Le compromis est signé 🍾",
    title: "Champagne ! Le compromis est signé 🍾",
    greeting: "Bonjour Alexandre,",
    body: `<p style="margin:0;">Pssst, la vente du bien que vous avez recommandé (Jean DUPONT) avance super bien ! Le compromis a été signé ✍️</p>`,
    cta: { label: "Voir mes recommandations", url: `${appUrl}/portail/mes-recommandations` },
  });

  // 4. Notification - Commission versée
  await sendPremiumEmail({
    to,
    subject: "[PREVIEW] Votre gain vous attend ! 🤑",
    title: "Votre gain vous attend ! 🤑",
    greeting: "Bonjour Alexandre,",
    body: `<p style="margin:0;">Tout est bon ! La transaction Jean DUPONT est finalisée et votre reco vous a rapporté un joli gain 🤩</p>`,
    cta: { label: "Voir ma cagnotte", url: `${appUrl}/portail/tableau-de-bord` },
  });

  // 5. Récap hebdomadaire
  await sendPremiumEmail({
    to,
    subject: "[PREVIEW] Votre récap de la semaine",
    title: "Récap hebdomadaire",
    greeting: "Bonjour Alexandre,",
    body: `
      <p style="margin:0 0 15px;">Voici votre récap de la semaine :</p>
      <div style="background:#f9f6f1;padding:15px 20px;margin:0 0 15px;">
        <p style="margin:0;font-size:14px;color:#030A24;">📊 Cette semaine : <strong>2 nouvelles recommandations</strong></p>
        <p style="margin:8px 0 0;font-size:14px;color:#030A24;">📈 Total : <strong>12 recommandations</strong>, <strong>3 contrats</strong></p>
        <p style="margin:8px 0 0;font-size:14px;color:#030A24;">💰 Commissions cumulées : <strong>2 400 €</strong></p>
        <p style="margin:8px 0 0;font-size:14px;color:#030A24;">🏆 Classement : <strong>3ème sur 15 ambassadeurs</strong></p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;">Continuez à recommander pour monter dans le classement !</p>
    `,
    cta: { label: "Voir mon tableau de bord", url: `${appUrl}/portail/tableau-de-bord` },
  });

  // 6. Nouveau lead (pour admin/négociateur)
  await sendPremiumEmail({
    to,
    subject: "[PREVIEW] Nouvelle recommandation reçue",
    title: "Nouvelle recommandation",
    greeting: "Bonjour,",
    body: `
      <p style="margin:0 0 15px;">Un ambassadeur vient de soumettre une nouvelle recommandation :</p>
      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:0 0 15px;">
        <p style="margin:0;font-size:14px;color:#030A24;"><strong>Prospect :</strong> Marie MARTIN</p>
        <p style="margin:5px 0 0;font-size:14px;color:#030A24;"><strong>Type :</strong> Achat</p>
        <p style="margin:5px 0 0;font-size:14px;color:#030A24;"><strong>Ambassadeur :</strong> Angela BRITES</p>
      </div>
    `,
    cta: { label: "Traiter la recommandation", url: `${appUrl}/admin/recommandations` },
  });

  return { success: true, sent: 6 };
}
