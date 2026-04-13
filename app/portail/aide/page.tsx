"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, MessageSquare, ClipboardList, Coins, FileText, Shield, Smartphone, Mail, Phone } from "lucide-react";
import Link from "next/link";

const FAQ_SECTIONS = [
  {
    icon: ClipboardList,
    title: "Recommandations",
    questions: [
      {
        q: "Comment recommander un contact ?",
        a: "Rendez-vous dans l'onglet \u00ab Recommander \u00bb du menu. Remplissez le formulaire avec les coordonn\u00e9es de votre contact et son type de projet (achat, vente, investissement). Votre recommandation sera automatiquement transmise \u00e0 votre n\u00e9gociateur.",
      },
      {
        q: "Comment suivre mes recommandations ?",
        a: "Dans \u00ab Mes recommandations \u00bb, vous voyez l'\u00e9tat de chaque lead : Nouveau, Contact\u00e9, En cours, Sign\u00e9 ou Perdu. Vous recevez une notification \u00e0 chaque changement de statut.",
      },
      {
        q: "Que se passe-t-il apr\u00e8s ma recommandation ?",
        a: "Votre n\u00e9gociateur re\u00e7oit une alerte et contacte le prospect dans les 48 heures. Vous \u00eates inform\u00e9 \u00e0 chaque \u00e9tape via notification et par email.",
      },
      {
        q: "Puis-je recommander plusieurs contacts en m\u00eame temps ?",
        a: "Oui, chaque recommandation est ind\u00e9pendante. Vous pouvez en soumettre autant que vous le souhaitez, sans limite. Plus vous recommandez, plus vos chances de toucher des commissions augmentent !",
      },
    ],
  },
  {
    icon: Coins,
    title: "Commissions",
    questions: [
      {
        q: "Quand est-ce que je touche ma commission ?",
        a: "Votre commission est vers\u00e9e apr\u00e8s la signature d\u00e9finitive de l'acte de vente chez le notaire et le r\u00e8glement des honoraires. Le d\u00e9lai d\u00e9pend du type de transaction (g\u00e9n\u00e9ralement 2 \u00e0 4 mois apr\u00e8s la mise en relation).",
      },
      {
        q: "Quel est le montant de la commission ?",
        a: "Le taux de commission est d\u00e9fini dans votre contrat ambassadeur. G\u00e9n\u00e9ralement, il s'agit de 5% des honoraires d'agence sur chaque transaction aboutie. Par exemple, pour des honoraires de 10 000 \u20ac, vous percevez 500 \u20ac.",
      },
      {
        q: "O\u00f9 voir mes commissions ?",
        a: "Rendez-vous dans \u00ab Mes commissions \u00bb pour voir le d\u00e9tail de chaque commission (pay\u00e9e, en attente, montant). La jauge sur votre tableau de bord vous donne un aper\u00e7u rapide de vos gains acquis et potentiels.",
      },
      {
        q: "Comment recevoir le paiement de ma commission ?",
        a: "Assurez-vous d'avoir renseign\u00e9 votre RIB (IBAN) dans votre profil. Sans coordonn\u00e9es bancaires, nous ne pouvons pas proc\u00e9der au versement. Rendez-vous dans \u00ab Mon profil \u00bb pour l'ajouter.",
      },
    ],
  },
  {
    icon: FileText,
    title: "Contrats",
    questions: [
      {
        q: "Comment signer mon contrat ?",
        a: "Allez dans \u00ab Mes contrats \u00bb. Cliquez sur le contrat en attente de signature, puis apposez votre signature \u00e9lectronique directement dans l'app. C'est l\u00e9galement valide.",
      },
      {
        q: "Qu'est-ce que la reconnaissance d'honoraires ?",
        a: "C'est un document qui confirme votre droit \u00e0 la commission sur une transaction donn\u00e9e. Elle pr\u00e9cise le montant exact et doit \u00eatre sign\u00e9e par les deux parties avant le versement.",
      },
      {
        q: "Qu'est-ce que le contrat d'apporteur d'affaires ?",
        a: "C'est le document juridique qui formalise votre r\u00f4le d'ambassadeur aupr\u00e8s de La Brie Immobili\u00e8re. Il d\u00e9finit les conditions de r\u00e9mun\u00e9ration, vos obligations et celles de l'agence. Il est sign\u00e9 \u00e9lectroniquement par les deux parties.",
      },
    ],
  },
  {
    icon: Smartphone,
    title: "Application",
    questions: [
      {
        q: "Comment installer l'app sur mon t\u00e9l\u00e9phone ?",
        a: "The Club est une PWA (Progressive Web App). Sur iPhone : ouvrez le site dans Safari, appuyez sur le bouton Partager (\u2191), puis \u00ab Sur l'\u00e9cran d'accueil \u00bb. Sur Android : le navigateur vous proposera automatiquement l'installation, ou utilisez le menu \u22ee puis \u00ab Ajouter \u00e0 l'\u00e9cran d'accueil \u00bb.",
      },
      {
        q: "Comment activer les notifications ?",
        a: "Allez dans \u00ab Mon profil \u00bb et cliquez sur \u00ab Activer les notifications \u00bb. Vous recevrez des alertes push m\u00eame quand l'app est ferm\u00e9e : nouveaux messages, changements de statut de vos recommandations, etc.",
      },
      {
        q: "L'app fonctionne-t-elle hors connexion ?",
        a: "Certaines pages sont mises en cache pour un acc\u00e8s rapide. Toutefois, les actions (recommander, envoyer un message) n\u00e9cessitent une connexion internet.",
      },
    ],
  },
  {
    icon: MessageSquare,
    title: "Messagerie",
    questions: [
      {
        q: "\u00c0 qui puis-je envoyer des messages ?",
        a: "Vous pouvez communiquer avec votre n\u00e9gociateur attribu\u00e9 et les administrateurs de La Brie Immobili\u00e8re directement depuis la messagerie int\u00e9gr\u00e9e.",
      },
      {
        q: "Suis-je notifi\u00e9 des nouveaux messages ?",
        a: "Oui, par notification dans l'app, par email, et par notification push si vous les avez activ\u00e9es.",
      },
    ],
  },
  {
    icon: Shield,
    title: "Compte & s\u00e9curit\u00e9",
    questions: [
      {
        q: "Comment changer mon mot de passe ?",
        a: "Allez dans \u00ab Mon profil \u00bb et utilisez la section \u00ab Changer le mot de passe \u00bb. Le nouveau mot de passe doit contenir au moins 8 caract\u00e8res, 1 majuscule et 1 chiffre.",
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Dans \u00ab Mon profil \u00bb, en bas de page, vous trouverez le bouton \u00ab Supprimer mon compte \u00bb. Cette action est irr\u00e9versible et supprime toutes vos donn\u00e9es.",
      },
      {
        q: "Comment exporter mes donn\u00e9es ?",
        a: "Conform\u00e9ment au RGPD, vous pouvez t\u00e9l\u00e9charger toutes vos donn\u00e9es personnelles depuis \u00ab Mon profil \u00bb \u2192 \u00ab Exporter mes donn\u00e9es \u00bb.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 dark:border-white/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-3"
      >
        <p className="text-sm font-medium text-gray-900 dark:text-white">{q}</p>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="text-sm text-gray-600 dark:text-gray-300 pb-4 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function AidePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Aide &amp; FAQ
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Trouvez des r&eacute;ponses &agrave; vos questions sur le fonctionnement de The Club
        </p>
      </div>

      {FAQ_SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden rounded-lg">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
              <Icon className="w-4 h-4 text-[#D1B280]" />
              <h2 className="font-semibold text-gray-900 dark:text-white">{section.title}</h2>
            </div>
            <div className="px-5">
              {section.questions.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Contact section */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="text-center mb-4">
          <HelpCircle className="w-8 h-8 text-[#D1B280] mx-auto mb-3" />
          <p className="font-semibold text-gray-900 dark:text-white mb-1">Vous ne trouvez pas la r&eacute;ponse ?</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Contactez-nous directement, notre &eacute;quipe vous r&eacute;pondra dans les plus brefs d&eacute;lais
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/portail/messagerie"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D1B280] text-[#030A24] text-sm font-semibold hover:bg-[#b89a65] transition-colors rounded-lg justify-center"
          >
            <MessageSquare className="w-4 h-4" />
            Ouvrir la messagerie
          </Link>
          <a
            href="mailto:contact@labrieimmobiliere.fr"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#030A24] text-[#D1B280] text-sm font-semibold hover:bg-[#0f1e40] transition-colors rounded-lg justify-center"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
          <a
            href="tel:+33164000000"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors rounded-lg justify-center"
          >
            <Phone className="w-4 h-4" />
            T&eacute;l&eacute;phone
          </a>
        </div>
      </div>
    </div>
  );
}
