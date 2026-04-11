import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ success: true }); // silent

    await prisma.verificationToken.deleteMany({ where: { identifier: `magic:${email}` } });

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await prisma.verificationToken.create({
      data: { identifier: `magic:${email}`, token, expires },
    });

    const magicUrl = `${process.env.NEXTAUTH_URL}/auth/magic?token=${token}`;
    const firstName = user.name?.split(" ")[0] ?? "Bonjour";

    await transporter.sendMail({
      from: `"The Club - La Brie Immobilière" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Votre lien de connexion — The Club",
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
            <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:300;letter-spacing:2px;">THE CLUB</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="color:#ffffff;font-size:16px;margin:0 0 16px 0;">Bonjour ${firstName},</p>
            <p style="color:rgba(255,255,255,0.8);font-size:14px;line-height:1.7;margin:0 0 24px 0;">
              Voici votre lien de connexion à <strong style="color:#C9A96E;">The Club</strong>.<br>
              Cliquez sur le bouton pour accéder directement à votre espace sans mot de passe.<br>
              <strong style="color:rgba(255,255,255,0.5);font-size:12px;">Ce lien est valable 15 minutes et à usage unique.</strong>
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
              <tr>
                <td style="background:#C9A96E;border-radius:4px;">
                  <a href="${magicUrl}" style="display:block;padding:14px 32px;color:#030A24;font-size:14px;font-weight:bold;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                    Accéder à mon espace
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">
              Si vous n'avez pas demandé ce lien, ignorez cet email.
            </p>
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

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
