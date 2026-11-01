import { NextRequest, NextResponse } from "next/server";
import { AVIS_GOOGLE, conseillerModelo, type AgenceLBI } from "@/lib/conseillers-modelo";

// Lien « Laisser un avis Google » des emails Modelo InTouch.
// ?email={{user.email}} -> fenêtre d'avis Google de l'agence du conseiller.
// ?agence=villecresnes|brie-comte-robert|marolles force l'agence ; à défaut : Villecresnes.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const forcee = params.get("agence") as AgenceLBI | null;
  const agence: AgenceLBI =
    (forcee && forcee in AVIS_GOOGLE ? forcee : conseillerModelo(params.get("email"))?.agence) ?? "villecresnes";

  return NextResponse.redirect(
    `https://search.google.com/local/writereview?placeid=${AVIS_GOOGLE[agence]}`,
    { status: 302, headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
