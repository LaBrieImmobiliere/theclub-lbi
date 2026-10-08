"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Copy, Check, Share2, Link2, QrCode as QrCodeIcon, Download } from "lucide-react";

interface Props {
  code: string;
  firstName?: string | null;
  baseUrl: string;
}

export function PersonalLinkCard({ code, firstName, baseUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const shareUrl = `${baseUrl}/r/${code}`;
  const whatsAppMessage = `Salut ! 👋\n\nJe fais partie du réseau The Club de La Brie Immobilière. Si tu as un projet immobilier (achat ou vente), laisse tes coordonnées ici en 30 secondes, un conseiller te rappellera :\n\n${shareUrl}`;

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 1,
      color: { dark: "#030A24", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [shareUrl]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`, "_blank");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "The Club — La Brie Immobilière",
          text: whatsAppMessage,
          url: shareUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copyLink();
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-${code}.png`;
    link.click();
  };

  return (
    <Card className="border-brand-gold/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-brand-gold" />
          <h2 className="font-semibold text-gray-900">Votre lien personnel</h2>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Partagez ce lien à vos contacts. Toute recommandation reçue via ce lien vous
          sera automatiquement attribuée.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* QR code + lien */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {qrDataUrl ? (
            <div className="flex-shrink-0 border-2 border-gray-100 rounded-lg p-2 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR code pour ${code}`}
                width={160}
                height={160}
                className="w-40 h-40"
              />
            </div>
          ) : (
            <div className="w-40 h-40 bg-gray-50 rounded-lg flex items-center justify-center">
              <QrCodeIcon className="w-10 h-10 text-gray-300" />
            </div>
          )}

          <div className="flex-1 min-w-0 w-full space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                Lien à partager
              </p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <code className="text-xs sm:text-sm text-gray-700 flex-1 truncate font-mono">
                  {shareUrl}
                </code>
                <button
                  onClick={copyLink}
                  className="flex-shrink-0 text-gray-500 hover:text-gray-900 transition-colors"
                  title="Copier le lien"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={shareWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white text-sm font-medium rounded hover:bg-[#1EBE57] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </button>
              <button
                onClick={shareNative}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#D1B280] text-[#D1B280] text-sm font-medium rounded hover:bg-[#D1B280]/5 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
              <button
                onClick={downloadQr}
                disabled={!qrDataUrl}
                className="sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Télécharger le QR code"
              >
                <Download className="w-4 h-4" />
                <span className="sm:hidden">QR code</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-brand-cream/60 border-l-2 border-brand-gold px-4 py-3 text-xs text-gray-600 leading-relaxed">
          <strong className="text-gray-900">Astuce{firstName ? `, ${firstName}` : ""} :</strong>{" "}
          imprimez le QR code sur vos cartes de visite ou flyers. En soirée ou lors d&apos;un rendez-vous,
          il suffit d&apos;un scan avec l&apos;appareil photo du téléphone pour que votre contact arrive sur
          votre page personnelle.
        </div>
      </CardContent>
    </Card>
  );
}
