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
        {/* Splash screen styles — inline pour rendu immédiat (avant JS) */}
        <style dangerouslySetInnerHTML={{ __html: `
          #splash-screen {
            position: fixed; inset: 0; z-index: 9999;
            background: #030A24;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            transition: opacity 0.4s ease, visibility 0.4s ease;
          }
          #splash-screen.hide {
            opacity: 0; visibility: hidden; pointer-events: none;
          }
          #splash-screen img {
            width: 120px; height: 120px;
            animation: splashPulse 1.8s ease-in-out infinite;
          }
          #splash-screen .splash-text {
            margin-top: 24px;
            font-family: 'Fira Sans', sans-serif;
            font-size: 14px; font-weight: 500;
            letter-spacing: 3px; text-transform: uppercase;
            color: #D1B280;
            opacity: 0;
            animation: splashFadeIn 0.6s ease 0.3s forwards;
          }
          #splash-screen .splash-bar {
            margin-top: 32px; width: 48px; height: 3px;
            background: rgba(209,178,128,0.2); border-radius: 2px;
            overflow: hidden;
            opacity: 0;
            animation: splashFadeIn 0.6s ease 0.5s forwards;
          }
          #splash-screen .splash-bar::after {
            content: ''; display: block;
            width: 50%; height: 100%;
            background: #D1B280; border-radius: 2px;
            animation: splashSlide 1s ease-in-out infinite;
          }
          @keyframes splashPulse {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.06); opacity: 1; }
          }
          @keyframes splashFadeIn {
            to { opacity: 1; }
          }
          @keyframes splashSlide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}} />
      </head>
      <body className="bg-white min-h-full flex flex-col">
        {/* Splash screen — visible immédiatement, caché une fois React hydraté */}
        <div id="splash-screen">
          <img src="/logo-white.png" alt="" width={120} height={120} />
          <div className="splash-text">The Club</div>
          <div className="splash-bar" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var s=document.getElementById('splash-screen');
            if(!s)return;
            // Cache le splash dès que la page a fini de charger (hydratation React)
            function hide(){s.classList.add('hide');setTimeout(function(){s.remove()},500)}
            if(document.readyState==='complete'){setTimeout(hide,300)}
            else{window.addEventListener('load',function(){setTimeout(hide,300)})}
          })();
        `}} />
        <Providers>{children}</Providers>
        <RegisterSW />
        <PwaInstallPrompt />
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
