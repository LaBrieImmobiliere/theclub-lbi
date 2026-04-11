import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendNegotiatorWelcomeEmail, sendNewAmbassadorEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non disponible en production" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "ambassador";

  try {
    let result: boolean;

    if (type === "negotiator") {
      // Test: email de bienvenue négociateur (avec QR code)
      result = await sendNegotiatorWelcomeEmail(
        "contact@labrieimmobiliere.fr",
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
        "contact@labrieimmobiliere.fr",
        "Alexandre Brites",
        "Sophie Martin",
        "sophie.martin@example.com",
        "06 12 34 56 78",
        "Villecresnes N19"
      );
    } else {
      // Test: email de bienvenue ambassadeur (avec infos négociateur)
      result = await sendWelcomeEmail(
        "contact@labrieimmobiliere.fr",
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
        ? `Email "${type}" envoyé avec succès à contact@labrieimmobiliere.fr`
        : "Échec de l'envoi - vérifiez les logs serveur",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
