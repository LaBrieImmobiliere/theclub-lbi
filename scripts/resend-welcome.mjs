import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import QRCode from "qrcode";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const fromAddress = `"The Club - La Brie Immobilière" <${process.env.EMAIL_FROM}>`;

// Negotiators to resend — add emails here
const TARGETS = ["luis.brites@labrieimmobiliere.fr"];

async function main() {
  for (const targetEmail of TARGETS) {
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { negotiator: { include: { agency: true } } },
    });

    if (!user || !user.negotiator) {
      console.log(`✗ Non trouvé ou pas négociateur : ${targetEmail}`);
      continue;
    }

    const neg = user.negotiator;
    const agency = neg.agency;

    // Generate temp password matching original pattern
    const firstName = user.name?.split(" ")[0] ?? "LBI";
    const tempPassword = `${firstName}LBI94!@`;
    const hashed = await bcrypt.hash(tempPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    const portalUrl = `${process.env.NEXTAUTH_URL}/portail/tableau-de-bord`;
    const referralUrl = `${process.env.NEXTAUTH_URL}/rejoindre?ref=${neg.code}`;

    // QR code
    const qrDataUrl = await QRCode.toDataURL(referralUrl, {
      width: 400, margin: 2,
      color: { dark: "#030A24", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });
    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");

    const agencyName = agency?.name ?? "La Brie Immobilière";
    const agencyAddress = agency?.address ?? "";
    const agencyCity = agency?.city ?? "";
    const agencyPhone = agency?.phone ?? "";
    const agencyEmail = agency?.email ?? "";

    const tips = [
      { icon: "&#128101;", title: "Parlez du programme à vos clients satisfaits", desc: "Après une vente ou un achat réussi, proposez-leur de recommander leurs proches. Un client heureux est votre meilleur ambassadeur." },
      { icon: "&#128241;", title: "Partagez votre QR Code", desc: "Imprimez-le sur vos cartes de visite, affichez-le en agence ou envoyez-le par SMS. Chaque scan = un potentiel nouveau mandat." },
      { icon: "&#128337;", title: "Le bon timing fait tout", desc: "Un voisin qui déménage, un collègue qui investit, un ami qui divorce… Soyez attentif aux signaux de projets immobiliers autour de vous." },
      { icon: "&#127919;", title: "Suivez vos leads en temps réel", desc: "Depuis votre espace, visualisez chaque recommandation, son statut et vos commissions. Relancez au bon moment." },
      { icon: "&#129309;", title: "Créez un réseau de confiance", desc: "Entretenez la relation avec vos ambassadeurs via la messagerie intégrée. Un ambassadeur informé recommande 3x plus." },
      { icon: "&#128200;", title: "Fixez-vous un objectif", desc: "2 recommandations par mois = 24 prospects qualifiés par an. Chaque recommandation qui aboutit, c'est 5% d'honoraires pour vous." },
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
      <h1 style="color:#030A24; font-size:24px; margin:0 0 8px 0; font-family: 'Fira Sans', Arial, sans-serif;">Bienvenue ${user.name} !</h1>
      <p style="color:#D1B280; font-size:13px; margin:0 0 4px 0; font-weight:600; text-transform:uppercase; letter-spacing:1px; font-family: Arial, sans-serif;">Négociateur</p>
      <p style="color:#888; font-size:13px; margin:0; font-family: Arial, sans-serif;">Agence de <strong style="color:#030A24;">${agencyName}</strong></p>
    </td>
  </tr>

  <!-- INTRO -->
  <tr>
    <td style="padding: 0 40px 25px 40px;">
      <p style="color:#333; font-size:15px; line-height:1.7; margin:0; font-family: Arial, sans-serif;">
        Vous intégrez le programme <strong>The Club</strong> en tant que négociateur rattaché à l'agence de <strong>${agencyName}</strong>${agencyAddress ? ` (${agencyAddress}, ${agencyCity})` : ""}.
        Votre espace personnel est prêt : suivez vos recommandations, échangez avec vos ambassadeurs et développez votre réseau.
      </p>
    </td>
  </tr>

  <!-- CREDENTIALS -->
  <tr>
    <td style="padding: 0 40px 25px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1; border-left: 3px solid #D1B280;">
        <tr><td style="padding: 25px 25px 10px 25px;">
          <p style="margin:0; font-size:13px; color:#888; text-transform:uppercase; letter-spacing:1px; font-weight:600; font-family: Arial, sans-serif;">Vos identifiants</p>
        </td></tr>
        <tr><td style="padding: 0 25px 8px 25px;">
          <p style="margin:0; font-size:15px; color:#333; font-family: Arial, sans-serif;"><strong>Email :</strong> ${user.email}</p>
        </td></tr>
        <tr><td style="padding: 0 25px 20px 25px;">
          <p style="margin:0; font-size:15px; color:#333; font-family: Arial, sans-serif;"><strong>Mot de passe :</strong> ${tempPassword}</p>
        </td></tr>
        <tr><td style="padding: 0 25px 20px 25px;">
          <p style="margin:0; font-size:12px; color:#999; font-style:italic; font-family: Arial, sans-serif;">Pensez à modifier votre mot de passe lors de votre première connexion.</p>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- REFERRAL CODE + QR CODE -->
  <tr>
    <td style="padding: 0 40px 30px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#030A24;">
        <tr><td style="padding: 30px; text-align: center;">
          <p style="color:#D1B280; font-size:11px; letter-spacing:3px; margin:0 0 10px 0; text-transform:uppercase; font-family: Arial, sans-serif;">Votre code parrainage</p>
          <p style="color:#ffffff; font-size:28px; font-weight:700; margin:0 0 20px 0; letter-spacing:3px; font-family: 'Courier New', monospace;">${neg.code}</p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td align="center" style="background:#ffffff; padding:10px;">
            <img src="cid:qrcode" alt="QR Code parrainage" width="180" height="180" style="display:block; width:180px; height:180px; border:0;" />
          </td></tr></table>
          <p style="color:#ffffff80; font-size:11px; margin:15px 0 0 0; font-family: Arial, sans-serif;">Scannez ou partagez ce QR code — il renvoie directement vers votre lien de parrainage</p>
          <p style="color:#D1B280; font-size:12px; margin:8px 0 0 0; word-break:break-all; font-family: Arial, sans-serif;">
            <a href="${referralUrl}" style="color:#D1B280; text-decoration:underline;">${referralUrl}</a>
          </p>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding: 0 40px 35px 40px; text-align: center;">
      <a href="${portalUrl}" style="display:inline-block; background:#D1B280; color:#ffffff; text-decoration:none; padding:16px 50px; font-size:14px; font-weight:700; letter-spacing:2px; text-transform:uppercase; font-family: Arial, sans-serif;">
        Accéder à mon espace
      </a>
    </td>
  </tr>

  <tr><td style="padding: 0 40px;"><hr style="border:none; border-top:1px solid #eee; margin:0;" /></td></tr>

  <!-- TIPS -->
  <tr><td style="padding: 30px 40px 10px 40px;">
    <h2 style="color:#030A24; font-size:18px; margin:0 0 5px 0; font-family: 'Fira Sans', Arial, sans-serif;">6 conseils pour développer votre réseau</h2>
    <p style="color:#888; font-size:13px; margin:0 0 15px 0; font-family: Arial, sans-serif;">Maximisez vos recommandations et vos commissions :</p>
  </td></tr>
  <tr><td style="padding: 0 40px 30px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0">${tipsHtml}</table>
  </td></tr>

  <!-- AGENCY -->
  ${agency ? `<tr><td style="padding: 0 40px 30px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1; border-left: 3px solid #D1B280;">
      <tr><td style="padding: 20px 25px;">
        <p style="margin:0 0 5px 0; font-size:13px; color:#888; text-transform:uppercase; letter-spacing:1px; font-weight:600; font-family: Arial, sans-serif;">Votre agence de rattachement</p>
        <p style="margin:0 0 3px 0; font-size:15px; color:#030A24; font-weight:700; font-family: Arial, sans-serif;">La Brie Immobilière — ${agencyName}</p>
        <p style="margin:0 0 3px 0; font-size:14px; color:#555; font-family: Arial, sans-serif;">${agencyAddress}, ${agencyCity}</p>
        <p style="margin:0; font-size:14px; color:#555; font-family: Arial, sans-serif;">
          ${agencyPhone ? `&#9742; ${agencyPhone}` : ""}${agencyPhone && agencyEmail ? " &nbsp;|&nbsp; " : ""}${agencyEmail ? `<a href="mailto:${agencyEmail}" style="color:#D1B280;">${agencyEmail}</a>` : ""}
        </p>
      </td></tr>
    </table>
  </td></tr>` : ""}

  <!-- QUOTE -->
  <tr><td style="padding: 0 40px 35px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#030A24;">
      <tr><td style="padding: 25px 30px; text-align:center;">
        <p style="color:#D1B280; font-size:15px; font-style:italic; margin:0 0 8px 0; line-height:1.5; font-family: Georgia, serif;">
          &laquo; Un négociateur qui active son réseau de recommandation transforme chaque client satisfait en source de nouveaux mandats. Le programme The Club est votre accélérateur de croissance. &raquo;
        </p>
        <p style="color:#ffffff60; font-size:12px; margin:0; font-family: Arial, sans-serif;">— La Direction, La Brie Immobilière</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#030A24; padding: 25px 40px; text-align: center;">
    <p style="color:#D1B280; font-size:11px; margin:0 0 4px 0; letter-spacing:2px; text-transform:uppercase; font-family: Arial, sans-serif;">The Club : La Brie Immobilière</p>
    <p style="color:#ffffff40; font-size:11px; margin:0; font-family: Arial, sans-serif;">41, avenue du Maréchal de Lattre de Tassigny, 94440 VILLECRESNES</p>
    <p style="color:#ffffff30; font-size:10px; margin:8px 0 0 0; font-family: Arial, sans-serif;">SIRET 48525508700010 | RCS Créteil 485255087</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const logoPath = path.resolve(ROOT, "public/logo-white.png");

    await transporter.sendMail({
      from: fromAddress,
      to: user.email,
      subject: `Bienvenue ${user.name} — Négociateur à l'agence de ${agencyName} | The Club`,
      html,
      attachments: [
        { filename: "logo.png", path: logoPath, cid: "logo" },
        { filename: "qrcode.png", content: Buffer.from(qrBase64, "base64"), contentType: "image/png", cid: "qrcode" },
      ],
    });

    console.log(`✓ Mail envoyé à ${user.name} (${user.email}) — mdp temporaire : ${tempPassword}`);
  }

  console.log("\nTerminé.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
