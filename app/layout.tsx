import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { RegisterSW } from "@/components/register-sw";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "The Club - La Brie Immobilière",
    template: "%s | The Club LBI",
  },
  description: "Recommandez vos proches ayant un projet immobilier et touchez 5% de commission sur les honoraires. Rejoignez le réseau d'ambassadeurs de La Brie Immobilière.",
  keywords: ["immobilier", "parrainage", "commission", "ambassadeur", "La Brie Immobilière", "apporteur d'affaires"],
  openGraph: {
    title: "The Club - La Brie Immobilière",
    description: "Recommandez et gagnez 5% de commission sur chaque transaction immobilière.",
    url: "https://theclub.labrieimmobiliere.fr",
    siteName: "The Club LBI",
    locale: "fr_FR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  themeColor: "#030A24",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Club",
    startupImage: "/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: true,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#030A24",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-white min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <RegisterSW />
        <PwaInstallPrompt />
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
