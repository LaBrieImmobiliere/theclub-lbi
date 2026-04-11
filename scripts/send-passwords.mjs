import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "crypto";
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
  const negotiators = await prisma.user.findMany({ where: { role: "NEGOTIATOR" } });
  console.log(`${negotiators.length} négociateurs trouvés`);

  for (const user of negotiators) {
    if (!user.email) continue;

    // Générer un token de réinitialisation valable 7 jours
    await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await prisma.verificationToken.create({ data: { identifier: user.email, token, expires } });

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/nouveau-mot-de-passe?token=${token}`;
    const firstName = user.name?.split(" ")[0] ?? "Bonjour";

    await transporter.sendMail({
      from: `"The Club - La Brie Immobilière" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: "🔑 Accédez à votre espace — The Club",
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#030A24;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);">
            <p style="color:#C9A96E;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px 0;">La Brie Immobilière</p>
            <h1 style="color:#ffffff;font-size:28px;margin:0;font-weight:300;letter-spacing:2px;">THE CLUB</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#ffffff;font-size:16px;margin:0 0 16px 0;">Bonjour ${firstName},</p>
            <p style="color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;margin:0 0 8px 0;">
              Votre espace négociateur sur <strong style="color:#C9A96E;">The Club</strong> est prêt.<br>
              Cliquez ci-dessous pour définir votre mot de passe et accéder à votre tableau de bord.
            </p>
            <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 24px 0;">
              Identifiant : <strong style="color:rgba(255,255,255,0.7);">${user.email}</strong>
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr>
                <td style="background:#C9A96E;border-radius:4px;">
                  <a href="${resetUrl}" style="display:block;padding:14px 32px;color:#030A24;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                    Définir mon mot de passe
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 24px 0;">
              Ce lien est valable <strong>7 jours</strong>.<br>
              Une fois connecté, vous pourrez aussi vous connecter sans mot de passe via le <strong>lien magique</strong> sur la page de connexion.
            </p>
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;margin-top:8px;">
              <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 8px 0;">
                <strong style="color:#C9A96E;">Accès direct :</strong>
              </p>
              <a href="${process.env.NEXTAUTH_URL}/auth/connexion" style="color:#C9A96E;font-size:13px;">
                ${process.env.NEXTAUTH_URL}/auth/connexion
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;">
            <p style="color:rgba(255,255,255,0.3);font-size:11px;margin:0;">© 2026 La Brie Immobilière — depuis 1969</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    console.log(`✓ Email envoyé à ${user.name} (${user.email})`);
  }

  console.log("\nTerminé.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
