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
    <html lang="fr" className="h-full antialiased" style={{ background: "#030A24" }}>
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Splash — CSS inline, premier truc parsé par le navigateur.
            html/body démarrent en #030A24 (même couleur que le manifest)
            pour éviter tout flash blanc. Le body repasse en blanc quand
            le splash se cache. */}
        <style dangerouslySetInnerHTML={{ __html: `
          html,body{background:#030A24}
          #splash-screen{
            position:fixed;inset:0;z-index:9999;
            background:#030A24;
            display:flex;flex-direction:column;
            align-items:center;justify-content:center;
            transition:opacity .5s ease,visibility .5s ease;
          }
          #splash-screen.hide{opacity:0;visibility:hidden;pointer-events:none}
          #splash-screen img{
            width:120px;height:120px;
            animation:splashPulse 1.8s ease-in-out infinite;
          }
          #splash-screen .splash-text{
            margin-top:24px;
            font-family:'Fira Sans',system-ui,sans-serif;
            font-size:14px;font-weight:500;
            letter-spacing:3px;text-transform:uppercase;
            color:#D1B280;opacity:0;
            animation:splashFadeIn .6s ease .2s forwards;
          }
          #splash-screen .splash-bar{
            margin-top:32px;width:48px;height:3px;
            background:rgba(209,178,128,.2);border-radius:2px;
            overflow:hidden;opacity:0;
            animation:splashFadeIn .6s ease .4s forwards;
          }
          #splash-screen .splash-bar::after{
            content:'';display:block;width:50%;height:100%;
            background:#D1B280;border-radius:2px;
            animation:splashSlide 1s ease-in-out infinite;
          }
          @keyframes splashPulse{
            0%,100%{transform:scale(1);opacity:.9}
            50%{transform:scale(1.06);opacity:1}
          }
          @keyframes splashFadeIn{to{opacity:1}}
          @keyframes splashSlide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        `}} />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: "#030A24" }}>
        {/* Splash — affiché immédiatement dans le HTML initial, avant tout JS */}
        <div id="splash-screen">
          <img src="/logo-white.png" alt="" width={120} height={120} />
          <div className="splash-text">The Club</div>
          <div className="splash-bar" />
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var s=document.getElementById('splash-screen');
            if(!s)return;
            var shown=Date.now();
            var MIN=1200;
            function hide(){
              // Minimum 1.2s pour que l'animation soit lisible
              var elapsed=Date.now()-shown;
              var wait=Math.max(0,MIN-elapsed);
              setTimeout(function(){
                s.classList.add('hide');
                // Remet le body en blanc une fois le splash fondu
                document.body.style.background='';
                document.documentElement.style.background='';
                setTimeout(function(){s.remove()},600);
              },wait);
            }
            if(document.readyState==='complete'){hide()}
            else{window.addEventListener('load',hide)}
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
