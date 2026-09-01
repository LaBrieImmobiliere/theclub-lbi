import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/bienvenue" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Mentions l&eacute;gales
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Conform&eacute;ment &agrave; la loi n&deg;2004-575 du 21 juin 2004 pour la confiance dans l&apos;&eacute;conomie num&eacute;rique (LCEN) et &agrave; la loi n&deg;70-9 du 2 janvier 1970 r&eacute;glementant les conditions d&apos;exercice des activit&eacute;s relatives &agrave; certaines op&eacute;rations portant sur les immeubles et les fonds de commerce (Loi Hoguet).
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">

          {/* 1. Éditeur */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. &Eacute;diteur du site</h2>
            <p>
              Le site <strong>The Club</strong> (theclub.labrieimmobiliere.fr) est &eacute;dit&eacute; par :<br />
              <strong>La Brie Immobili&egrave;re</strong><br />
              Soci&eacute;t&eacute; par actions simplifi&eacute;e (SAS) au capital de <strong>[&agrave; compl&eacute;ter] &euro;</strong><br />
              Si&egrave;ge social : 41, avenue du Mar&eacute;chal de Lattre de Tassigny, 94440 Villecresnes, France<br />
              T&eacute;l&eacute;phone : 01 45 95 95 95<br />
              Email : <a href="mailto:contact@labrieimmobiliere.fr" className="text-blue-600 hover:underline">contact@labrieimmobiliere.fr</a><br />
              RCS : <strong>Cr&eacute;teil [num&eacute;ro &agrave; compl&eacute;ter]</strong><br />
              SIRET : <strong>[&agrave; compl&eacute;ter]</strong><br />
              N&deg; TVA intracommunautaire : <strong>FR[&agrave; compl&eacute;ter]</strong><br />
              Code APE/NAF : <strong>[&agrave; compl&eacute;ter — typiquement 6831Z]</strong><br />
              Directeur de la publication : <strong>Alexandre Brites</strong>, en qualit&eacute; de pr&eacute;sident
            </p>
          </section>

          {/* 2. Carte professionnelle Loi Hoguet */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Activit&eacute; r&eacute;glement&eacute;e &mdash; Loi Hoguet</h2>
            <p>
              La Brie Immobili&egrave;re exerce une activit&eacute; d&apos;agent immobilier r&eacute;glement&eacute;e par la loi n&deg;70-9 du 2 janvier 1970 (loi Hoguet) et son d&eacute;cret d&apos;application n&deg;72-678 du 20 juillet 1972.
            </p>
            <p className="mt-3">
              <strong>Carte professionnelle</strong> n&deg; <strong>[&agrave; compl&eacute;ter]</strong><br />
              Mentions : <strong>Transactions sur immeubles et fonds de commerce (T) &mdash; Gestion immobili&egrave;re (G)</strong> [&agrave; ajuster]<br />
              D&eacute;livr&eacute;e le <strong>[date &agrave; compl&eacute;ter]</strong> par la <strong>CCI de Paris &Icirc;le-de-France [&agrave; confirmer]</strong>
            </p>
            <p className="mt-3">
              <strong>Garantie financi&egrave;re</strong> :<br />
              Organisme garant : <strong>[Galian / SOCAF / CEGC / QBE &mdash; &agrave; compl&eacute;ter]</strong><br />
              Adresse : <strong>[&agrave; compl&eacute;ter]</strong><br />
              Montant de la garantie : <strong>[&agrave; compl&eacute;ter] &euro;</strong>
            </p>
            <p className="mt-3">
              <strong>Assurance Responsabilit&eacute; Civile Professionnelle</strong> :<br />
              Compagnie : <strong>[&agrave; compl&eacute;ter]</strong><br />
              Adresse : <strong>[&agrave; compl&eacute;ter]</strong><br />
              Couverture g&eacute;ographique : France
            </p>
            <p className="mt-3 italic">
              La Brie Immobili&egrave;re <strong>[re&ccedil;oit / ne re&ccedil;oit pas]</strong> de fonds, effets ou valeurs autres que ceux repr&eacute;sentatifs de sa r&eacute;mun&eacute;ration ou commission.
            </p>
          </section>

          {/* 3. Hébergeur */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. H&eacute;bergeur</h2>
            <p>
              Le site est h&eacute;berg&eacute; par :<br />
              <strong>Vercel Inc.</strong><br />
              440 N Bashaw St, Covina, CA 91723, &Eacute;tats-Unis<br />
              Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">vercel.com</a>
            </p>
            <p className="mt-3">
              Base de donn&eacute;es : <strong>Neon (Neon Inc., 209 Park Road, Burlingame, CA 94010, &Eacute;tats-Unis)</strong>, h&eacute;berg&eacute;e en Union europ&eacute;enne (r&eacute;gion Francfort).
            </p>
          </section>

          {/* 4. Statut des ambassadeurs */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Plateforme The Club &mdash; statut des ambassadeurs</h2>
            <p>
              The Club est une plateforme priv&eacute;e r&eacute;serv&eacute;e aux <strong>apporteurs d&apos;affaires occasionnels</strong> de La Brie Immobili&egrave;re. Les ambassadeurs n&apos;exercent <strong>aucune activit&eacute; r&eacute;glement&eacute;e par la Loi Hoguet</strong> : ils transmettent uniquement des contacts (recommandations) sans participer &agrave; la n&eacute;gociation, la r&eacute;daction ou la conclusion d&apos;actes.
            </p>
            <p className="mt-3">
              Les commissions vers&eacute;es aux ambassadeurs constituent des <strong>revenus &agrave; d&eacute;clarer fiscalement</strong> par leurs b&eacute;n&eacute;ficiaires (BNC non professionnels ou autre cat&eacute;gorie selon situation). Chaque ambassadeur est responsable de ses obligations d&eacute;claratives.
            </p>
          </section>

          {/* 5. Médiateur de la consommation */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. M&eacute;diation de la consommation</h2>
            <p>
              Conform&eacute;ment aux articles L.611-1 et suivants du Code de la consommation, et apr&egrave;s avoir tent&eacute; au pr&eacute;alable de r&eacute;soudre le litige directement aupr&egrave;s de La Brie Immobili&egrave;re, tout client consommateur a la possibilit&eacute; de saisir gratuitement un m&eacute;diateur de la consommation :
            </p>
            <p className="mt-3">
              <strong>[Nom du m&eacute;diateur &mdash; ex&nbsp;: ANM Conso / MEDIMMOCONSO &mdash; &agrave; compl&eacute;ter]</strong><br />
              Adresse : <strong>[&agrave; compl&eacute;ter]</strong><br />
              Site web : <strong>[&agrave; compl&eacute;ter]</strong>
            </p>
            <p className="mt-3">
              <strong>Plateforme europ&eacute;enne de r&egrave;glement en ligne des litiges</strong> (RLL) :<br />
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://ec.europa.eu/consumers/odr/</a>
            </p>
          </section>

          {/* 6. Propriété intellectuelle */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Propri&eacute;t&eacute; intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu du site (textes, images, graphismes, logo, ic&ocirc;nes, sons, vid&eacute;os, logiciels, structure, code source) est la propri&eacute;t&eacute; exclusive de La Brie Immobili&egrave;re ou de ses partenaires et est prot&eacute;g&eacute; par les lois fran&ccedil;aises et internationales relatives au droit d&apos;auteur et &agrave; la propri&eacute;t&eacute; intellectuelle.
            </p>
            <p className="mt-3">
              Toute reproduction, repr&eacute;sentation, modification, publication, transmission, ou d&eacute;naturation, totale ou partielle, du site ou de son contenu, par quelque proc&eacute;d&eacute; que ce soit et sur quelque support que ce soit, est interdite sans l&apos;autorisation &eacute;crite pr&eacute;alable de La Brie Immobili&egrave;re. Toute utilisation non autoris&eacute;e constitue une contrefa&ccedil;on sanctionn&eacute;e par les articles L.335-2 et suivants du Code de la propri&eacute;t&eacute; intellectuelle.
            </p>
          </section>

          {/* 7. Responsabilité */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Responsabilit&eacute;</h2>
            <p>
              La Brie Immobili&egrave;re s&apos;efforce de fournir des informations aussi pr&eacute;cises que possible. Toutefois, elle ne saurait &ecirc;tre tenue responsable des omissions, des inexactitudes ou des carences dans la mise &agrave; jour de ces informations, qu&apos;elles soient de son fait ou du fait de tiers fournissant ces informations.
            </p>
            <p className="mt-3">
              L&apos;utilisateur reconna&icirc;t utiliser le site sous sa seule et enti&egrave;re responsabilit&eacute;. La Brie Immobili&egrave;re ne saurait &ecirc;tre tenue pour responsable des dommages directs ou indirects r&eacute;sultant de l&apos;utilisation du site, d&apos;une interruption de service, ou de la pr&eacute;sence d&apos;&eacute;ventuels virus.
            </p>
          </section>

          {/* 8. Données personnelles */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Donn&eacute;es personnelles &mdash; RGPD</h2>
            <p>
              Les donn&eacute;es personnelles collect&eacute;es sur ce site sont trait&eacute;es conform&eacute;ment au R&egrave;glement (UE) 2016/679 (RGPD) et &agrave; la loi Informatique et Libert&eacute;s modifi&eacute;e.
            </p>
            <p className="mt-3">
              <strong>Responsable de traitement</strong> : La Brie Immobili&egrave;re (coordonn&eacute;es ci-dessus)<br />
              <strong>D&eacute;l&eacute;gu&eacute; &agrave; la protection des donn&eacute;es (DPO)</strong> : <strong>[nom / email &agrave; compl&eacute;ter ou &laquo;&nbsp;non d&eacute;sign&eacute;&nbsp;&raquo;]</strong>
            </p>
            <p className="mt-3">
              Pour le d&eacute;tail des traitements, dur&eacute;es de conservation et exercice des droits (acc&egrave;s, rectification, effacement, portabilit&eacute;, opposition, limitation), consultez notre{" "}
              <Link href="/politique-confidentialite" className="text-blue-600 hover:underline">
                Politique de confidentialit&eacute;
              </Link>.
            </p>
            <p className="mt-3">
              Vous disposez &eacute;galement du droit d&apos;introduire une r&eacute;clamation aupr&egrave;s de la <strong>CNIL</strong> :<br />
              3 Place de Fontenoy &mdash; TSA 80715 &mdash; 75334 Paris Cedex 07<br />
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cnil.fr</a>
            </p>
          </section>

          {/* 9. Cookies */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Cookies</h2>
            <p>
              Le site utilise uniquement des cookies <strong>strictement n&eacute;cessaires</strong> au fonctionnement du service (authentification, session utilisateur, s&eacute;curit&eacute;). Ces cookies sont exempt&eacute;s de consentement conform&eacute;ment &agrave; l&apos;article 82 de la loi Informatique et Libert&eacute;s et aux recommandations de la CNIL.
            </p>
            <p className="mt-3">
              Aucun cookie publicitaire, de suivi comportemental ou de mesure d&apos;audience tierce n&apos;est d&eacute;pos&eacute; sans votre consentement pr&eacute;alable.
            </p>
          </section>

          {/* 10. Liens hypertextes */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Liens hypertextes</h2>
            <p>
              Le site peut contenir des liens vers des sites tiers. La Brie Immobili&egrave;re n&apos;exerce aucun contr&ocirc;le sur ces sites et d&eacute;cline toute responsabilit&eacute; quant &agrave; leur contenu, leur politique de confidentialit&eacute; ou leurs pratiques.
            </p>
            <p className="mt-3">
              La cr&eacute;ation de liens vers le site The Club est autoris&eacute;e sous r&eacute;serve de ne pas porter atteinte &agrave; l&apos;image de La Brie Immobili&egrave;re et de ne pas utiliser le site dans un cadre commercial ou publicitaire sans autorisation pr&eacute;alable.
            </p>
          </section>

          {/* 11. CGU */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Conditions g&eacute;n&eacute;rales d&apos;utilisation</h2>
            <p>
              L&apos;utilisation de la plateforme The Club est r&eacute;gie par des{" "}
              <strong>Conditions G&eacute;n&eacute;rales d&apos;Utilisation</strong> sp&eacute;cifiques, accept&eacute;es par chaque utilisateur lors de son inscription. Ces CGU pr&eacute;cisent notamment les r&egrave;gles relatives au statut d&apos;ambassadeur, au versement des commissions et &agrave; la r&eacute;siliation du compte.
            </p>
          </section>

          {/* 12. Droit applicable */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">12. Droit applicable et juridiction comp&eacute;tente</h2>
            <p>
              Les pr&eacute;sentes mentions l&eacute;gales sont r&eacute;gies par le <strong>droit fran&ccedil;ais</strong>.
            </p>
            <p className="mt-3">
              En cas de litige et &agrave; d&eacute;faut de r&eacute;solution amiable ou par voie de m&eacute;diation, comp&eacute;tence est express&eacute;ment attribu&eacute;e aux <strong>tribunaux comp&eacute;tents de Cr&eacute;teil</strong>, nonobstant pluralit&eacute; de d&eacute;fendeurs ou appel en garantie.
            </p>
          </section>

          {/* Mise à jour */}
          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            Derni&egrave;re mise &agrave; jour : avril 2026
          </p>
        </div>
      </div>
    </div>
  );
}
