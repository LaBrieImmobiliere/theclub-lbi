"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, MessageSquare, ClipboardList, Coins, FileText, Shield, Smartphone } from "lucide-react";
import Link from "next/link";

const FAQ_SECTIONS = [
  {
    icon: ClipboardList,
    title: "Recommandations",
    questions: [
      {
        q: "Comment recommander un contact ?",
        a: "Rendez-vous dans l'onglet « Recommander » du menu. Remplissez le formulaire avec les coordonnées de votre contact et son type de projet (achat, vente, investissement). Votre recommandation sera automatiquement transmise à votre négociateur.",
      },
      {
        q: "Comment suivre mes recommandations ?",
        a: "Dans « Mes recommandations », vous voyez l'état de chaque lead : Nouveau, Contacté, En cours, Signé ou Perdu. Vous recevez une notification à chaque changement de statut.",
      },
      {
        q: "Que se passe-t-il après ma recommandation ?",
        a: "Votre négociateur reçoit une alerte et contacte le prospect. Vous êtes informé à chaque étape via la notification et par email.",
      },
    ],
  },
  {
    icon: Coins,
    title: "Commissions",
    questions: [
      {
        q: "Quand est-ce que je touche ma commission ?",
        a: "Votre commission est versée après la signature définitive de l'acte de vente chez le notaire et le règlement des honoraires. Le délai dépend du type de transaction.",
      },
      {
        q: "Quel est le montant de la commission ?",
        a: "Le taux de commission est défini dans votre contrat ambassadeur. Généralement, il s'agit de 5% des honoraires d'agence sur chaque transaction aboutie.",
      },
      {
        q: "Où voir mes commissions ?",
        a: "Rendez-vous dans « Mes commissions » pour voir le détail de chaque commission (payée, en attente, montant). La jauge sur votre tableau de bord vous donne un aperçu rapide.",
      },
    ],
  },
  {
    icon: FileText,
    title: "Contrats",
    questions: [
      {
        q: "Comment signer mon contrat ?",
        a: "Allez dans « Mes contrats ». Cliquez sur le contrat en attente de signature, puis apposez votre signature électronique directement dans l'app. C'est légalement valide.",
      },
      {
        q: "Qu'est-ce que la reconnaissance d'honoraires ?",
        a: "C'est un document qui confirme votre droit à la commission sur une transaction donnée. Vous devez le signer pour valider votre commission.",
      },
    ],
  },
  {
    icon: Smartphone,
    title: "Application",
    questions: [
      {
        q: "Comment installer l'app sur mon téléphone ?",
        a: "The Club est une PWA (Progressive Web App). Sur iPhone : ouvrez le site dans Safari, appuyez sur le bouton Partager, puis « Sur l'écran d'accueil ». Sur Android : le navigateur vous proposera automatiquement l'installation.",
      },
      {
        q: "Comment activer les notifications ?",
        a: "Allez dans « Mon profil » et cliquez sur « Activer les notifications ». Vous recevrez des alertes push même quand l'app est fermée.",
      },
      {
        q: "L'app fonctionne-t-elle hors connexion ?",
        a: "Certaines pages sont mises en cache pour un accès rapide. Toutefois, les actions (recommander, envoyer un message) nécessitent une connexion internet.",
      },
    ],
  },
  {
    icon: MessageSquare,
    title: "Messagerie",
    questions: [
      {
        q: "À qui puis-je envoyer des messages ?",
        a: "Vous pouvez communiquer avec votre négociateur attribué et les administrateurs de La Brie Immobilière directement depuis la messagerie intégrée.",
      },
      {
        q: "Suis-je notifié des nouveaux messages ?",
        a: "Oui, par notification dans l'app, par email, et par notification push si vous les avez activées.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Compte & sécurité",
    questions: [
      {
        q: "Comment changer mon mot de passe ?",
        a: "Allez dans « Mon profil » et utilisez la section « Changer le mot de passe ». Le nouveau mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 chiffre.",
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Dans « Mon profil », en bas de page, vous trouverez le bouton « Supprimer mon compte ». Cette action est irréversible et supprime toutes vos données.",
      },
      {
        q: "Comment exporter mes données ?",
        a: "Conformément au RGPD, vous pouvez télécharger toutes vos données personnelles depuis « Mon profil » → « Exporter mes données ».",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-3"
      >
        <p className="text-sm font-medium text-gray-900">{q}</p>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="text-sm text-gray-600 pb-4 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function AidePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Aide & FAQ
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Trouvez des réponses à vos questions
        </p>
      </div>

      {FAQ_SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Icon className="w-4 h-4 text-[#D1B280]" />
              <h2 className="font-semibold text-gray-900">{section.title}</h2>
            </div>
            <div className="px-5">
              {section.questions.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        );
      })}

      <div className="bg-[#030A24] text-white p-6 text-center">
        <HelpCircle className="w-8 h-8 text-[#D1B280] mx-auto mb-3" />
        <p className="font-semibold mb-1">Vous ne trouvez pas la réponse ?</p>
        <p className="text-white/60 text-sm mb-4">
          Contactez-nous directement via la messagerie intégrée
        </p>
        <Link
          href="/portail/messagerie"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D1B280] text-[#030A24] text-sm font-semibold hover:bg-[#b89a65] transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Ouvrir la messagerie
        </Link>
      </div>
    </div>
  );
}
