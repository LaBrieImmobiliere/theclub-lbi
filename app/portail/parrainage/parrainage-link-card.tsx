"use client";
// SMS invitation + social sharing v2
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, Link2, ExternalLink, MessageSquare, Smartphone, FileImage, FileText, QrCode } from "lucide-react";
import QRCodeLib from "qrcode";
import { ShareButton } from "@/components/share-button";

const SMS_MESSAGE = (url: string) =>
  "Salut !\n\nJe fais partie du club ambassadeurs La Brie Immobili\u00e8re et je pense que \u00e7a pourrait t\u2019int\u00e9resser \uD83D\uDE0A\n\nSi tu connais quelqu\u2019un qui cherche \u00e0 acheter, vendre ou investir dans l\u2019immobilier, tu peux le recommander via mon lien et toucher une commission de 5% sur chaque transaction r\u00e9alis\u00e9e.\n\nC\u2019est 100% gratuit, sans engagement, et \u00e7a prend 30 secondes pour s\u2019inscrire \uD83D\uDC49\n" + url + "\n\n\uD83D\uDCF1 Une fois inscrit(e), installe l\u2019app sur ton t\u00e9l\u00e9phone : tu acc\u00e8des \u00e0 ton espace en un clic depuis ton \u00e9cran d\u2019accueil !\n\n\uD83D\uDCA1 Petit conseil : partage ce lien \u00e0 tes proches qui ont un projet immobilier, m\u00eame \u00e0 long terme. Une simple mise en relation peut te rapporter gros !\n\nBelle journ\u00e9e \u00e0 toi \u2728";

const SHARE_TEXT = (url: string) =>
  "Rejoins le club ambassadeurs La Brie Immobili\u00e8re ! Recommande des contacts et touche 5% de commission sur chaque transaction r\u00e9alis\u00e9e. Inscris-toi ici : " + url + " \uD83D\uDCF1 (installable sur mobile)";

export function ParrainageLinkCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [smsCopied, setSmsCopied] = useState(false);
  const [downloading, setDownloading] = useState<"jpg" | "pdf" | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://theclub.labrieimmobiliere.fr";

  const referralUrl = `${baseUrl}/rejoindre?ref=${code}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, referralUrl, {
        width: 240,
        margin: 2,
        color: { dark: "#030A24", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
    }
  }, [referralUrl]);

  const downloadJpg = async () => {
    setDownloading("jpg");
    try {
      // Create a larger canvas with branding
      const size = 600;
      const padding = 40;
      const qrSize = size - padding * 2;

      const offscreen = document.createElement("canvas");
      offscreen.width = size;
      offscreen.height = size + 120;
      const ctx = offscreen.getContext("2d")!;

      // Background
      ctx.fillStyle = "#030A24";
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      // White QR area
      const qrCanvas = document.createElement("canvas");
      await QRCodeLib.toCanvas(qrCanvas, referralUrl, {
        width: qrSize,
        margin: 2,
        color: { dark: "#030A24", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      ctx.drawImage(qrCanvas, padding, padding, qrSize, qrSize);

      // Code text
      ctx.fillStyle = "#C9A96E";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      ctx.fillText(code, size / 2, qrSize + padding + 44);

      // Subtitle
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "18px Arial";
      ctx.fillText("The Club — La Brie Immobilière", size / 2, qrSize + padding + 76);

      // Download
      offscreen.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qrcode-${code}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/jpeg", 0.95);
    } finally {
      setDownloading(null);
    }
  };

  const downloadPdf = async () => {
    setDownloading("pdf");
    try {
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // Dark background
      doc.setFillColor(3, 10, 36);
      doc.rect(0, 0, pageW, pageH, "F");

      // Gold accent bar
      doc.setFillColor(201, 169, 110);
      doc.rect(0, 0, pageW, 2, "F");

      // Title
      doc.setTextColor(201, 169, 110);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("LA BRIE IMMOBILIÈRE", pageW / 2, 20, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("THE CLUB", pageW / 2, 30, { align: "center" });

      doc.setTextColor(201, 169, 110);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("MON QR CODE DE PARRAINAGE", pageW / 2, 40, { align: "center" });

      // QR code
      const qrCanvas = document.createElement("canvas");
      await QRCodeLib.toCanvas(qrCanvas, referralUrl, {
        width: 600, margin: 2,
        color: { dark: "#030A24", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      const qrData = qrCanvas.toDataURL("image/png");
      const qrW = 100;
      const qrX = (pageW - qrW) / 2;
      doc.addImage(qrData, "PNG", qrX, 48, qrW, qrW);

      // Code
      doc.setTextColor(201, 169, 110);
      doc.setFontSize(20);
      doc.setFont("courier", "bold");
      doc.text(code, pageW / 2, 162, { align: "center" });

      // URL
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(referralUrl, pageW / 2, 172, { align: "center" });

      // Divider
      doc.setDrawColor(201, 169, 110);
      doc.setLineWidth(0.3);
      doc.line(20, 180, pageW - 20, 180);

      // Instructions
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(9);
      doc.text("Scannez ce QR code pour accéder à votre lien de parrainage.", pageW / 2, 190, { align: "center" });
      doc.text("Partagez-le à vos contacts pour qu'ils soumettent une recommandation.", pageW / 2, 197, { align: "center" });

      // Footer
      doc.setFillColor(201, 169, 110);
      doc.rect(0, pageH - 2, pageW, 2, "F");
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text("The Club : La Brie Immobilière — 41, av. du Maréchal de Lattre de Tassigny, 94440 Villecresnes", pageW / 2, pageH - 5, { align: "center" });

      doc.save(`qrcode-${code}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "La Brie Immobili\u00e8re \u2014 Espace Ambassadeur",
        text: "Vous cherchez \u00e0 acheter, vendre ou investir dans l\u2019immobilier ? Contactez l\u2019\u00e9quipe LBI via mon lien personnel.",
        url: referralUrl,
      });
    } else {
      copyToClipboard();
    }
  };

  const sendSMS = () => {
    const message = SMS_MESSAGE(referralUrl);
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;
    window.open(smsUrl, "_self");
  };

  const copySMSText = async () => {
    await navigator.clipboard.writeText(SMS_MESSAGE(referralUrl));
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = SHARE_TEXT(referralUrl);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, "_blank");
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, "_blank");
  };

  const shareTelegram = () => {
    const text = SHARE_TEXT(referralUrl);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareInstagram = async () => {
    await navigator.clipboard.writeText(SMS_MESSAGE(referralUrl));
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 3000);
    window.open("https://www.instagram.com/", "_blank");
  };

  const shareTikTok = async () => {
    await navigator.clipboard.writeText(SMS_MESSAGE(referralUrl));
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 3000);
    window.open("https://www.tiktok.com/", "_blank");
  };

  return (
    <div className="space-y-4">

      {/* QR Code */}
      <Card className="border-brand-gold/30 bg-brand-deep text-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-brand-gold" />
            <h2 className="font-semibold text-white">Votre QR Code</h2>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-lg flex-shrink-0">
            <canvas ref={canvasRef} />
          </div>
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div>
              <p className="text-brand-gold text-xs tracking-widest uppercase mb-1">Code parrainage</p>
              <p className="text-white text-2xl font-bold font-mono tracking-widest">{code}</p>
            </div>
            <p className="text-white/60 text-xs leading-relaxed">
              Imprimez ou partagez ce QR code. Chaque scan redirige directement vers votre formulaire de recommandation.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={downloadJpg}
                disabled={!!downloading}
                className="gap-2 bg-brand-gold hover:bg-brand-gold-dark text-brand-deep font-semibold"
                size="sm"
              >
                <FileImage className="w-4 h-4" />
                {downloading === "jpg" ? "Export..." : "Télécharger JPG"}
              </Button>
              <Button
                onClick={downloadPdf}
                disabled={!!downloading}
                variant="outline"
                className="gap-2 border-brand-gold/40 text-white hover:bg-white/10"
                size="sm"
              >
                <FileText className="w-4 h-4" />
                {downloading === "pdf" ? "Export..." : "Télécharger PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lien unique */}
      <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Votre lien unique</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-500">Code ambassadeur :</p>
            <code className="bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-lg font-mono font-semibold text-sm">
              {code}
            </code>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate font-mono">{referralUrl}</span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant={copied ? "primary" : "outline"}
                size="sm"
                className={`flex-1 sm:flex-initial gap-1.5 ${copied ? "bg-green-600 hover:bg-green-700 border-green-600" : ""}`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    {"Copi\u00e9 !"}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copier
                  </>
                )}
              </Button>
              <Button onClick={share} variant="outline" size="sm" className="flex-1 sm:flex-initial gap-1.5">
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
            </div>
          </div>

          <ShareButton
            title="La Brie Immobili\u00e8re \u2014 Espace Ambassadeur"
            text={`Rejoins le club ambassadeurs La Brie Immobili\u00e8re ! Code : ${code}`}
            url={referralUrl}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#D1B280] text-[#030A24] px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#b89a65] transition-colors min-h-[44px]"
          >
            Partager mon code parrainage
          </ShareButton>

          <p className="text-xs text-gray-500">
            {"Partagez ce lien \u00e0 vos contacts. Chaque recommandation soumise via ce lien vous sera automatiquement attribu\u00e9e."}
          </p>
        </CardContent>
      </Card>

      {/* Invitation SMS */}
      <Card className="border-brand-gold/30 bg-gradient-to-br from-brand-cream/50 to-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-gold" />
            <div>
              <h2 className="font-semibold text-gray-900">{"\uD83D\uDCACInvitation SMS"}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {"Invitez vos contacts \u00e0 rejoindre votre club ambassadeurs via SMS"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {SMS_MESSAGE(referralUrl)}
            </p>
          </div>

          {/* SMS buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={sendSMS}
              className="flex-1 gap-2 bg-brand-deep hover:bg-brand-deep/90"
            >
              <Smartphone className="w-4 h-4" />
              {"Envoyer par SMS"}
            </Button>
            <Button
              onClick={copySMSText}
              variant="outline"
              className={`flex-1 gap-2 ${smsCopied ? "bg-green-50 border-green-300 text-green-700" : ""}`}
            >
              {smsCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  {"Message copi\u00e9 !"}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le message
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            {"Vous pouvez aussi partager ce message sur n\u2019importe quel r\u00e9seau social !"}
          </p>

          {/* Social sharing buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button
              onClick={shareFacebook}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
            <button
              onClick={shareInstagram}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-pink-50 hover:border-pink-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Instagram
            </button>
            <button
              onClick={shareTikTok}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-400 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.17v-3.4a4.85 4.85 0 01-4-.56z"/>
              </svg>
              TikTok
            </button>
            <button
              onClick={shareLinkedIn}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </button>
            <button
              onClick={shareTelegram}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-sky-50 hover:border-sky-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            {"Pour Instagram et TikTok, le message est copi\u00e9 dans votre presse-papier avant l\u2019ouverture de l\u2019app."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
