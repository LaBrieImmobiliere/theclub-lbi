"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Phone, Mail, MapPin, Copy, Check, Share2,
  MessageSquare, User, Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ContactInfo {
  negotiatorName: string | null;
  negotiatorEmail: string | null;
  negotiatorPhone: string | null;
  negotiatorImage: string | null;
  agencyName: string;
  agencyCity: string;
  agencyAddress: string;
  agencyPhone: string | null;
  agencyEmail: string | null;
}

interface Props {
  contact: ContactInfo;
}

function buildShareMessage(c: ContactInfo): string {
  const name = c.negotiatorName ?? "notre conseiller";
  const city = c.agencyCity;
  const phone = c.negotiatorPhone ?? c.agencyPhone ?? "";
  const email = c.negotiatorEmail ?? c.agencyEmail ?? "";

  let msg = `Bonjour,\n\nJe fais partie du réseau ambassadeurs La Brie Immobilière - ${city} et je pense que tu pourrais être intéressé(e) par leurs services. \uD83C\uDFE1\n\nSi tu as un projet immobilier (achat, vente, investissement), tu peux contacter directement :\n\n`;
  msg += `\uD83D\uDC64 ${name} — Conseiller La Brie Immobilière - ${city}\n`;
  if (phone) msg += `\uD83D\uDCDE ${phone}\n`;
  if (email) msg += `\u2709\uFE0F ${email}\n`;
  msg += `\n${c.agencyAddress}\n\nN'hésite pas à mentionner mon nom, c'est une équipe top ! \uD83D\uDE0A`;
  return msg;
}

export function ContactShareCard({ contact }: Props) {
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const shareMessage = buildShareMessage(contact);

  const copyCard = async () => {
    const lines: string[] = [];
    if (contact.negotiatorName) lines.push(`${contact.negotiatorName} — ${contact.agencyName}`);
    else lines.push(contact.agencyName);
    if (contact.negotiatorPhone) lines.push(`Tél : ${contact.negotiatorPhone}`);
    else if (contact.agencyPhone) lines.push(`Tél : ${contact.agencyPhone}`);
    if (contact.negotiatorEmail) lines.push(`Email : ${contact.negotiatorEmail}`);
    else if (contact.agencyEmail) lines.push(`Email : ${contact.agencyEmail}`);
    lines.push(contact.agencyAddress);
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(shareMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const sendSMS = () => {
    const url = `sms:?&body=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_self");
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${contact.agencyName} — Immobilier`,
        text: shareMessage,
      });
    } else {
      copyMessage();
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://theclub.labrieimmobiliere.fr")}`, "_blank");
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent("https://theclub.labrieimmobiliere.fr")}&text=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const shareInstagram = async () => {
    await navigator.clipboard.writeText(shareMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 3000);
    window.open("https://www.instagram.com/", "_blank");
  };

  const shareTikTok = async () => {
    await navigator.clipboard.writeText(shareMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 3000);
    window.open("https://www.tiktok.com/", "_blank");
  };

  const phone = contact.negotiatorPhone ?? contact.agencyPhone;
  const email = contact.negotiatorEmail ?? contact.agencyEmail;

  return (
    <div className="space-y-4">
      {/* Contact card */}
      <Card className="border-brand-gold/30 bg-brand-deep text-white overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <p className="text-brand-gold text-xs tracking-widest uppercase font-medium">
              Votre conseiller
            </p>
            <button
              onClick={copyCard}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
            >
              {copiedCard ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCard ? "Copié !" : "Copier"}
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-3 pb-6 space-y-4">
          {/* Negotiator with photo */}
          {contact.negotiatorName && (
            <div className="flex items-center gap-4">
              {contact.negotiatorImage ? (
                <Image
                  src={contact.negotiatorImage}
                  alt={contact.negotiatorName}
                  width={56}
                  height={56}
                  className="w-14 h-14 object-cover flex-shrink-0 border-2 border-brand-gold/40"
                  unoptimized
                />
              ) : (
                <div className="w-14 h-14 bg-brand-gold/20 flex items-center justify-center flex-shrink-0 border-2 border-brand-gold/40">
                  <span className="text-brand-gold font-bold text-xl">
                    {contact.negotiatorName[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-bold text-white text-lg">{contact.negotiatorName}</p>
                <p className="text-white/60 text-sm">Conseiller La Brie Immobilière - {contact.agencyCity}</p>
              </div>
            </div>
          )}

          {/* Agency with logo */}
          <div className="bg-white/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-white.png"
                alt={contact.agencyName}
                width={96}
                height={32}
                className="h-8 w-auto object-contain flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="font-semibold text-white">{contact.agencyName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
              <span className="text-white/70 text-sm">{contact.agencyAddress}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-white/40 flex-shrink-0" />
                <a href={`tel:${phone}`} className="text-white/70 text-sm hover:text-white transition-colors">
                  {phone}
                </a>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-white/40 flex-shrink-0" />
                <a href={`mailto:${email}`} className="text-white/70 text-sm hover:text-white transition-colors truncate">
                  {email}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pas de conseiller attribué */}
      {!contact.negotiatorName && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <p>Aucun conseiller n&apos;a encore été attribué à votre compte. Contactez l&apos;agence pour en savoir plus.</p>
          </div>
        </div>
      )}

      {/* Message à partager */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-gold" />
            <h2 className="font-semibold text-gray-900">Message à envoyer à vos proches</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Partagez ce message avec vos contacts ayant un projet immobilier
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
            {shareMessage}
          </div>

          {/* Primary action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={sendSMS}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#030A24] text-white text-sm font-medium hover:bg-[#0f1e40] transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              Envoyer par SMS
            </button>
            <button
              onClick={shareNative}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#D1B280] text-[#D1B280] text-sm font-medium hover:bg-[#D1B280]/5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </button>
            <button
              onClick={copyMessage}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 border text-sm font-medium transition-colors ${
                copiedMsg
                  ? "border-green-300 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {copiedMsg ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedMsg ? "Copié !" : "Copier"}
            </button>
          </div>

          {/* Social sharing buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button
              onClick={shareFacebook}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
            <button
              onClick={shareInstagram}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-pink-50 hover:border-pink-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Instagram
            </button>
            <button
              onClick={shareTikTok}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-gray-100 hover:border-gray-400 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.17v-3.4a4.85 4.85 0 01-4-.56z"/>
              </svg>
              TikTok
            </button>
            <button
              onClick={shareLinkedIn}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </button>
            <button
              onClick={shareTelegram}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 hover:bg-sky-50 hover:border-sky-300 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            Pour Instagram et TikTok, le message est copié dans votre presse-papier avant l&apos;ouverture de l&apos;app.
          </p>
        </CardContent>
      </Card>

      {/* Comment ça marche */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Comment ça marche ?
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                step: "1",
                title: "Partagez les coordonnées",
                desc: "Envoyez les coordonnées de votre conseiller à vos contacts qui ont un projet immobilier.",
                color: "bg-brand-deep",
              },
              {
                step: "2",
                title: "Soumettez une recommandation",
                desc: "Utilisez le formulaire « Recommander » pour enregistrer officiellement la mise en relation.",
                color: "bg-brand-gold",
              },
              {
                step: "3",
                title: "Recevez votre commission",
                desc: "Lorsque la transaction aboutit, vous recevez votre commission conformément à votre contrat.",
                color: "bg-green-600",
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex gap-4">
                <div
                  className={`w-8 h-8 ${color} text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5`}
                >
                  {step}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
