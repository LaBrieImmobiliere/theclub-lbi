import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import nodemailer from "nodemailer";

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

async function main() {
  // 1. Afficher ce qui existe
  const users = await prisma.user.findMany({
    include: { negotiator: true, ambassador: true },
  });

  console.log("\n=== UTILISATEURS EXISTANTS ===");
  for (const u of users) {
    const type = u.role;
    console.log(`[${type}] ${u.name ?? "(sans nom)"} - ${u.email}`);
  }

  // 2. Identifier les négociateurs (Theo, Matteo, Baptiste, Alexandre)
  const negotiators = users.filter((u) => u.role === "NEGOTIATOR");
  const admin = users.find((u) => u.role === "ADMIN");

  console.log(`\n→ Admin: ${admin?.email}`);
  console.log(`→ Négociateurs: ${negotiators.map((n) => n.name).join(", ")}`);

  // 3. Supprimer les ambassadeurs de test (tous sauf admin et négociateurs)
  const toDelete = users.filter(
    (u) => u.role === "AMBASSADOR"
  );

  if (toDelete.length > 0) {
    const ambassadorIds = toDelete.map((u) => u.ambassador?.id).filter(Boolean);
    const userIds = toDelete.map((u) => u.id);

    console.log(`\n=== SUPPRESSION DE ${toDelete.length} AMBASSADEUR(S) DE TEST ===`);

    // 1. HonoraryAcknowledgments → via contracts
    const contracts = await prisma.contract.findMany({ where: { ambassadorId: { in: ambassadorIds } } });
    const contractIds = contracts.map((c) => c.id);
    if (contractIds.length > 0) {
      await prisma.honoraryAcknowledgment.deleteMany({ where: { contractId: { in: contractIds } } });
      await prisma.contract.deleteMany({ where: { id: { in: contractIds } } });
    }

    // 2. Leads
    await prisma.lead.deleteMany({ where: { ambassadorId: { in: ambassadorIds } } });

    // 3. Messages, Notifications, Broadcasts
    await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }] } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.broadcast.deleteMany({ where: { authorId: { in: userIds } } });

    // 4. Sessions & Accounts
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: userIds } } });

    // 5. Ambassador records
    await prisma.ambassador.deleteMany({ where: { id: { in: ambassadorIds } } });

    // 6. Users
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    console.log(`✓ ${toDelete.length} ambassadeur(s) de test supprimés (avec leads, contrats, messages)`);
  } else {
    console.log("\n✓ Aucun ambassadeur de test à supprimer");
  }

  // 4. Envoyer les emails aux négociateurs
  console.log("\n=== ENVOI DES EMAILS ===");
  for (const neg of negotiators) {
    if (!neg.email) continue;

    const firstName = neg.name?.split(" ")[0] ?? neg.name ?? "Bonjour";

    await transporter.sendMail({
      from: `"The Club - La Brie Immobilière" <${process.env.EMAIL_FROM}>`,
      to: neg.email,
      subject: "🏠 The Club est disponible — Votre espace négociateur",
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#030A24;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="padding:40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);">
            <p style="color:#C9A96E;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px 0;">La Brie Immobilière</p>
            <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:300;letter-spacing:2px;">THE CLUB</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="color:#ffffff;font-size:16px;margin:0 0 16px 0;">Bonjour ${firstName},</p>
            <p style="color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;margin:0 0 24px 0;">
              Votre espace négociateur sur <strong style="color:#C9A96E;">The Club</strong> est maintenant disponible.<br>
              Vous pouvez dès à présent vous connecter pour gérer vos ambassadeurs, suivre les recommandations et consulter vos tableaux de bord.
            </p>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
              <tr>
                <td style="background:#C9A96E;border-radius:4px;">
                  <a href="https://theclub.labrieimmobiliere.fr/auth/connexion"
                     style="display:block;padding:14px 32px;color:#030A24;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                    Accéder à mon espace
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 8px 0;">
              <strong style="color:rgba(255,255,255,0.8);">Identifiant :</strong> ${neg.email}
            </p>
            <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">
              Si c'est votre première connexion, utilisez le mot de passe qui vous a été communiqué.<br>
              Vous pourrez le modifier dans votre profil.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">
              © 2026 La Brie Immobilière — depuis 1969
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    console.log(`✓ Email envoyé à ${neg.name} (${neg.email})`);
  }

  console.log("\n=== TERMINÉ ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
