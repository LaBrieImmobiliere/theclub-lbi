import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * OCR carte de visite — appelle l'API Anthropic Messages avec vision si
 * ANTHROPIC_API_KEY est présente. Sinon renvoie 503 et le front retombe
 * sur la saisie manuelle (la photo reste affichée à côté du formulaire).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OCR non disponible — ANTHROPIC_API_KEY manquante" },
      { status: 503 }
    );
  }

  const { imageBase64, mediaType } = await req.json();
  if (!imageBase64) {
    return NextResponse.json({ error: "image manquante" }, { status: 400 });
  }

  const prompt = `Tu reçois la photo d'une carte de visite. Extrait STRICTEMENT en JSON les champs suivants :
- firstName (prénom)
- lastName (nom de famille)
- phone (téléphone principal, format français)
- email (email principal)
- company (société si visible)

Réponds UNIQUEMENT un JSON valide, sans texte autour, sans code block. Si un champ n'est pas lisible, mets null.`;

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType || "image/jpeg",
                  data: imageBase64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return NextResponse.json(
        { error: "OCR échec", detail: errText.slice(0, 300) },
        { status: 502 }
      );
    }

    const data = await anthropicRes.json();
    const text = data?.content?.[0]?.text?.trim?.() ?? "";

    // Enlève éventuels backticks
    const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    let parsed: Record<string, string | null> = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: regex sur le texte brut (au cas où le modèle rate le JSON)
      const phoneMatch = cleaned.match(/(\+?33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/);
      const emailMatch = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      parsed = {
        firstName: null,
        lastName: null,
        phone: phoneMatch?.[0] ?? null,
        email: emailMatch?.[0] ?? null,
        company: null,
      };
    }

    return NextResponse.json({
      firstName: parsed.firstName ?? null,
      lastName: parsed.lastName ?? null,
      phone: parsed.phone ?? null,
      email: parsed.email ?? null,
      company: parsed.company ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "OCR échec", detail: String(error).slice(0, 200) },
      { status: 500 }
    );
  }
}
