import { NextRequest, NextResponse } from "next/server";
import { conseillerModelo } from "@/lib/conseillers-modelo";

// Photo du conseiller pour la signature des emails Modelo InTouch.
// Modelo ne fournit pas de variable « photo » mais remplace {{user.email}} dans
// l'adresse d'une image : la signature pointe donc ici avec ?email=<email du conseiller>
// et on redirige vers sa photo hébergée par Modelo Office (Netty), rangée sous son
// numéro de négociateur Netty.
const NETTY_PHOTOS = "https://img.netty.immo/company57704yhu/assets/nego/";

export async function GET(request: NextRequest) {
  const conseiller = conseillerModelo(request.nextUrl.searchParams.get("email"));

  // Conseiller pas (encore) listé : pastille La Brie Immobilière plutôt qu'une image cassée
  if (!conseiller) {
    return NextResponse.redirect(new URL("/icons/icon-192x192.png", request.nextUrl.origin), {
      status: 302,
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  return NextResponse.redirect(`${NETTY_PHOTOS}${conseiller.netty}_l.jpg`, {
    status: 302,
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
