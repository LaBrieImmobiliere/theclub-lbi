import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { agency } from "@/lib/agency-config";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "pro1.mail.ovh.net",
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER || "",
    pass: process.env.EMAIL_SERVER_PASSWORD || "",
  },
});

const fromAddress = `"The Club - La Brie Immobilière" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`;

export async function POST() {
  const session = await auth();
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { emailLayout } = await import("@/lib/email-template");

  const html = emailLayout({
    preheader: "Modèle vierge de reconnaissance d'honoraires",
    title: "Reconnaissance d'Honoraires — Modèle vierge",
    greeting: "Bonjour,",
    body: `
      <p style="margin:0 0 15px;font-size:14px;color:#030A24;line-height:1.7;">
        Veuillez trouver ci-dessous le modèle vierge de <strong>reconnaissance d'honoraires</strong> à remplir manuellement.
      </p>

      <!-- En-tête du document -->
      <div style="background:#030A24;padding:20px 25px;margin:0 0 0;">
        <p style="margin:0;font-size:16px;color:#ffffff;font-weight:bold;">${agency.name}</p>
        <p style="margin:5px 0 0;font-size:12px;color:#D1B280;">Reconnaissance d'Honoraires</p>
      </div>

      <div style="border:1px solid #e2e8f0;border-top:0;padding:25px;margin:0 0 20px;">

        <p style="margin:0 0 20px;font-size:16px;color:#030A24;font-weight:bold;text-align:center;text-transform:uppercase;letter-spacing:1px;">
          Reconnaissance d'Honoraires
        </p>

        <p style="margin:0 0 5px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Référence contrat</p>
        <p style="margin:0 0 20px;font-size:14px;color:#030A24;border-bottom:1px dashed #ccc;padding-bottom:8px;">
          N° ___________________________________
        </p>

        <p style="margin:0 0 15px;font-size:14px;color:#030A24;line-height:1.8;">
          Je soussigné(e) ________________________________________, en qualité d'apporteur d'affaire,
          reconnais avoir droit au versement de la somme de :
        </p>

        <!-- Montant -->
        <div style="background:#ecfdf5;border:2px solid #059669;padding:15px 20px;text-align:center;margin:0 0 20px;">
          <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Montant</p>
          <p style="margin:8px 0 0;font-size:28px;color:#059669;font-weight:bold;">
            _______________ €
          </p>
          <p style="margin:8px 0 0;font-size:11px;color:#666;">
            HT : ___________ € &nbsp;&nbsp;|&nbsp;&nbsp; TVA (20%) : ___________ € &nbsp;&nbsp;|&nbsp;&nbsp; TTC : ___________ €
          </p>
        </div>

        <p style="margin:0 0 5px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Motif</p>
        <p style="margin:0 0 15px;font-size:14px;color:#030A24;border-bottom:1px dashed #ccc;padding-bottom:8px;">
          ___________________________________________________________________
        </p>

        <p style="margin:0 0 5px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Au titre du contrat d'apporteur d'affaire</p>
        <p style="margin:0 0 15px;font-size:14px;color:#030A24;border-bottom:1px dashed #ccc;padding-bottom:8px;">
          N° ___________________________________
        </p>

        <p style="margin:0 0 5px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Pour le bien situé</p>
        <p style="margin:0 0 20px;font-size:14px;color:#030A24;border-bottom:1px dashed #ccc;padding-bottom:8px;">
          ___________________________________________________________________
        </p>

        <p style="margin:0 0 5px;font-size:12px;color:#666;">
          <strong>Mode de paiement :</strong> ${agency.payment.methods}
        </p>
        <p style="margin:0 0 20px;font-size:12px;color:#666;">
          <strong>Délai de paiement :</strong> ${agency.payment.delay}
        </p>

        <!-- Signatures -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
          <tr>
            <td width="48%" style="vertical-align:top;">
              <div style="border:1px solid #cbd5e1;padding:10px;min-height:80px;">
                <p style="margin:0 0 5px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">
                  L'Agence — ${agency.name}
                </p>
                <p style="margin:40px 0 0;font-size:11px;color:#999;">Signature</p>
              </div>
            </td>
            <td width="4%"></td>
            <td width="48%" style="vertical-align:top;">
              <div style="border:1px solid #cbd5e1;padding:10px;min-height:80px;">
                <p style="margin:0 0 5px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">
                  Le Parrain — ________________
                </p>
                <p style="margin:40px 0 0;font-size:11px;color:#999;">Signature</p>
              </div>
            </td>
          </tr>
        </table>

        <p style="margin:20px 0 0;font-size:10px;color:#94a3b8;text-align:center;font-style:italic;">
          ${agency.name} — ${agency.address}, ${agency.postalCode} ${agency.city}<br>
          SIRET ${agency.siret} — RCS ${agency.rcs} ${agency.rcsNumber}
        </p>
      </div>
    `,
  });

  // Send to all admins
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true, name: true },
  });

  for (const admin of admins) {
    await transporter.sendMail({
      from: fromAddress,
      to: admin.email,
      subject: "Modèle vierge — Reconnaissance d'Honoraires — The Club",
      html,
    });
  }

  return NextResponse.json({
    success: true,
    sentTo: admins.map(a => a.email),
  });
}
