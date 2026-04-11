"use client";

import { useState } from "react";
import {
  Phone, Mail, MapPin, Copy, Check, Share2,
  MessageSquare, Building2, User, Smartphone,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ContactInfo {
  negotiatorName: string | null;
  negotiatorEmail: string | null;
  negotiatorPhone: string | null;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string | null;
  agencyEmail: string | null;
}

interface Props {
  contact: ContactInfo;
}

function buildShareMessage(c: ContactInfo): string {
  const name = c.negotiatorName ?? "notre conseiller";
  const agency = c.agencyName;
  const phone = c.negotiatorPhone ?? c.agencyPhone ?? "";
  const email = c.negotiatorEmail ?? c.agencyEmail ?? "";

  let msg = `Bonjour,\n\nJe fais partie du réseau ambassadeurs ${agency} et je pense que tu pourrais être intéressé(e) par leurs services. 🏡\n\nSi tu as un projet immobilier (achat, vente, investissement), tu peux contacter directement :\n\n`;
  msg += `👤 ${name} — Conseiller ${agency}\n`;
  if (phone) msg += `📞 ${phone}\n`;
  if (email) msg += `✉️ ${email}\n`;
  msg += `\n${c.agencyAddress}\n\nN'hésite pas à mentionner mon nom, c'est une équipe top ! 😊`;
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
          {/* Negotiator */}
          {contact.negotiatorName && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
                <span className="text-brand-gold font-bold text-lg">
                  {contact.negotiatorName[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-bold text-white text-lg">{contact.negotiatorName}</p>
                <p className="text-white/60 text-sm">Conseiller immobilier</p>
              </div>
            </div>
          )}

          {/* Agency */}
          <div className="bg-white/5 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-gold flex-shrink-0" />
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
          <div className="bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
            {shareMessage}
          </div>

          {/* Action buttons */}
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

          {/* WhatsApp */}
          <button
            onClick={shareWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-green-50 hover:border-green-300 text-sm font-medium text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Partager sur WhatsApp
          </button>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
