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
        {/* Splash inline. Créé et géré entièrement via un script qui tourne
            avant React (pas de JSX, pas de mutation du DOM contrôlé par
            React → aucun risque de mismatch d'hydratation). */}
        <style dangerouslySetInnerHTML={{ __html: `
          #lbi-splash{
            position:fixed;inset:0;z-index:9999;
            background:#030A24;
            display:flex;flex-direction:column;
            align-items:center;justify-content:center;
            transition:opacity .5s ease,visibility .5s ease;
          }
          #lbi-splash.lbi-hide{opacity:0;visibility:hidden;pointer-events:none}
          #lbi-splash img{
            width:120px;height:120px;
            animation:lbiSplashPulse 1.8s ease-in-out infinite;
          }
          #lbi-splash .lbi-splash-text{
            margin-top:24px;
            font-family:'Fira Sans',system-ui,sans-serif;
            font-size:14px;font-weight:500;
            letter-spacing:3px;text-transform:uppercase;
            color:#D1B280;opacity:0;
            animation:lbiSplashFadeIn .6s ease .2s forwards;
          }
          #lbi-splash .lbi-splash-bar{
            margin-top:32px;width:48px;height:3px;
            background:rgba(209,178,128,.2);border-radius:2px;
            overflow:hidden;opacity:0;
            animation:lbiSplashFadeIn .6s ease .4s forwards;
          }
          #lbi-splash .lbi-splash-bar::after{
            content:'';display:block;width:50%;height:100%;
            background:#D1B280;border-radius:2px;
            animation:lbiSplashSlide 1s ease-in-out infinite;
          }
          @keyframes lbiSplashPulse{
            0%,100%{transform:scale(1);opacity:.9}
            50%{transform:scale(1.06);opacity:1}
          }
          @keyframes lbiSplashFadeIn{to{opacity:1}}
          @keyframes lbiSplashSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            // Injecte le splash en tout premier dans <body>, AVANT React.
            // React ne voit jamais cet élément → aucune interférence avec
            // l'hydratation ni avec la navigation SPA.
            if(document.getElementById('lbi-splash'))return;
            var d=document.createElement('div');
            d.id='lbi-splash';
            d.innerHTML='<img src="/logo-white.png" alt="" width="120" height="120"><div class="lbi-splash-text">The Club</div><div class="lbi-splash-bar"></div>';
            function insert(){
              if(!document.body)return setTimeout(insert,10);
              document.body.insertBefore(d,document.body.firstChild);
            }
            insert();
            var t0=Date.now(),done=false;
            function hide(){
              if(done)return;done=true;
              var wait=Math.max(0,Math.min(1000,1000-(Date.now()-t0)));
              setTimeout(function(){
                d.classList.add('lbi-hide');
                setTimeout(function(){d.remove()},600);
              },wait);
            }
            if(document.readyState==='loading'){
              document.addEventListener('DOMContentLoaded',hide);
            }else{hide()}
            setTimeout(hide,3000);
          })();
        `}} />
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
