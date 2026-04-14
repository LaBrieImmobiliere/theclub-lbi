import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendNegotiatorWelcomeEmail, sendNewAmbassadorEmail, sendNotificationEmail } from "@/lib/email";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // En prod: réservé aux admins
  if (process.env.NODE_ENV === "production") {
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Admin requis" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "ambassador";
  const to = searchParams.get("to") || "contact@labrieimmobiliere.fr";

  try {
    let result: boolean;

    if (type === "notification") {
      // Test: email de notification (utilisé pour "Dossier clôturé" etc.)
      result = await sendNotificationEmail(
        to,
        "Alexandre BRITES",
        "Dossier clôturé ✅",
        "Le dossier Jean Dupont est désormais clôturé et archivé. Merci pour votre recommandation !"
      );
    } else if (type === "negotiator") {
      // Test: email de bienvenue négociateur (avec QR code)
      result = await sendNegotiatorWelcomeEmail(
        to,
        "Alexandre Brites",
        "TestMotDePasse123",
        "NEG-ABC123",
        {
          name: "Villecresnes N19",
          address: "41, avenue du Maréchal de Lattre de Tassigny",
          city: "VILLECRESNES",
          phone: "01 45 99 11 37",
          email: "villecresnes@labrieimmobiliere.fr",
        }
      );
    } else if (type === "new-ambassador") {
      // Test: email envoyé au négociateur quand un ambassadeur s'inscrit
      result = await sendNewAmbassadorEmail(
        to,
        "Alexandre Brites",
        "Sophie Martin",
        "sophie.martin@example.com",
        "06 12 34 56 78",
        "Villecresnes N19"
      );
    } else {
      // Test: email de bienvenue ambassadeur (avec infos négociateur)
      result = await sendWelcomeEmail(
        to,
        "Sophie Martin",
        "TestMotDePasse123",
        "AMBASSADOR",
        {
          name: "Alexandre Brites",
          email: "a.brites@labrieimmobiliere.fr",
          phone: "06 98 76 54 32",
          agencyName: "Villecresnes N19",
        }
      );
    }

    return NextResponse.json({
      success: result,
      message: result
        ? `Email "${type}" envoyé avec succès à ${to}`
        : "Échec de l'envoi - vérifiez les logs serveur",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
