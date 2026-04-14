import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { type, location, budget, draft } = await req.json();

  // Rule-based suggestion (no AI API needed for MVP)
  const templates: Record<string, string> = {
    ACHAT: `Cherche à acquérir un bien${location ? ` à ${location}` : ""}${budget ? ` pour un budget de ${budget}` : ""}. ${draft || "Contactez-le pour affiner ses critères et lui présenter nos biens disponibles."}`,
    VENTE: `Souhaite mettre en vente un bien${location ? ` situé à ${location}` : ""}. ${draft || "Prendre contact pour organiser une estimation et définir la stratégie de vente."}`,
    LOCATION: `Cherche à louer un bien${location ? ` à ${location}` : ""}${budget ? ` avec un budget mensuel de ${budget}` : ""}. ${draft || "Échanger sur ses critères et lui proposer les biens disponibles à la location."}`,
  };

  const suggestion = templates[type] || templates["ACHAT"];

  return NextResponse.json({ suggestion });
}
