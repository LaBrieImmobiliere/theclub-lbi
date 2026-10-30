import { NextRequest, NextResponse } from "next/server";

// Photo du conseiller pour la signature des emails Modelo InTouch.
// Modelo ne fournit pas de variable « photo » mais remplace {{user.email}} dans
// l'adresse d'une image : la signature pointe donc ici avec ?email=<email du conseiller>
// et on redirige vers sa photo hébergée par Modelo Office (Netty), rangée sous son
// numéro de négociateur Netty.
const NETTY_PHOTOS = "https://img.netty.immo/company57704yhu/assets/nego/";

// email du conseiller -> numéro de négociateur Netty (3 chiffres)
const NEGOCIATEURS: Record<string, string> = {
  "alexandre.brites@labrieimmobiliere.fr": "001",
  "luis.brites@labrieimmobiliere.fr": "108",
  "maria.brites@labrieimmobiliere.fr": "112",
  "theo.indrigo@labrieimmobiliere.fr": "140",
  "maeva.brouard@labrieimmobiliere.fr": "152",
  "matteo.kpakpo@labrieimmobiliere.fr": "154",
  "baptiste.diponio@labrieimmobiliere.fr": "156",
  "elisa.savart@labrieimmobiliere.fr": "158",
  "lea.gaucher@labrieimmobiliere.fr": "159",
};

export async function GET(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  const id = NEGOCIATEURS[email];

  // Conseiller pas (encore) listé : pastille La Brie Immobilière plutôt qu'une image cassée
  if (!id) {
    return NextResponse.redirect(new URL("/icons/icon-192x192.png", request.nextUrl.origin), {
      status: 302,
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  return NextResponse.redirect(`${NETTY_PHOTOS}${id}_l.jpg`, {
    status: 302,
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
