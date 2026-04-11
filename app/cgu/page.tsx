import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/bienvenue" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Conditions G&eacute;n&eacute;rales d&apos;Utilisation
        </h1>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Objet</h2>
            <p>
              Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales d&apos;Utilisation (CGU) r&eacute;gissent l&apos;acc&egrave;s et l&apos;utilisation de la plateforme <strong>The Club</strong>, &eacute;dit&eacute;e par La Brie Immobili&egrave;re, accessible &agrave; l&apos;adresse theclub.labrieimmobiliere.fr.
            </p>
            <p className="mt-2">
              L&apos;inscription sur la plateforme implique l&apos;acceptation pleine et enti&egrave;re des pr&eacute;sentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Description du service</h2>
            <p>
              The Club est une plateforme de gestion du programme ambassadeurs de La Brie Immobili&egrave;re. Elle permet :
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Aux <strong>ambassadeurs</strong> : de recommander des prospects, de suivre leurs recommandations et de percevoir des commissions</li>
              <li>Aux <strong>n&eacute;gociateurs</strong> : de g&eacute;rer les recommandations re&ccedil;ues et de suivre leur r&eacute;seau d&apos;ambassadeurs</li>
              <li>Aux <strong>administrateurs</strong> : de g&eacute;rer l&apos;ensemble du programme, les contrats et les commissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Inscription et compte</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>L&apos;acc&egrave;s &agrave; la plateforme n&eacute;cessite la cr&eacute;ation d&apos;un compte utilisateur.</li>
              <li>L&apos;utilisateur s&apos;engage &agrave; fournir des informations exactes et &agrave; les maintenir &agrave; jour.</li>
              <li>Le mot de passe est personnel et confidentiel. L&apos;utilisateur est responsable de sa s&eacute;curit&eacute;.</li>
              <li>Tout acc&egrave;s r&eacute;alis&eacute; avec les identifiants d&apos;un utilisateur est r&eacute;put&eacute; effectu&eacute; par celui-ci.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Programme ambassadeur</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>L&apos;ambassadeur s&apos;engage &agrave; recommander des contacts de bonne foi, r&eacute;ellement int&eacute;ress&eacute;s par un projet immobilier.</li>
              <li>Les commissions sont vers&eacute;es uniquement lorsque la transaction immobili&egrave;re est effectivement conclue.</li>
              <li>Le taux de commission est d&eacute;fini par contrat entre l&apos;ambassadeur et La Brie Immobili&egrave;re.</li>
              <li>La Brie Immobili&egrave;re se r&eacute;serve le droit de refuser ou d&apos;annuler une recommandation si elle estime qu&apos;elle ne respecte pas les conditions du programme.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Obligations de l&apos;utilisateur</h2>
            <p>L&apos;utilisateur s&apos;engage &agrave; :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Utiliser la plateforme conform&eacute;ment &agrave; sa destination</li>
              <li>Ne pas transmettre de fausses informations</li>
              <li>Respecter la confidentialit&eacute; des donn&eacute;es auxquelles il a acc&egrave;s</li>
              <li>Ne pas tenter de porter atteinte &agrave; la s&eacute;curit&eacute; de la plateforme</li>
              <li>Ne pas utiliser la plateforme &agrave; des fins frauduleuses ou illicites</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Propri&eacute;t&eacute; intellectuelle</h2>
            <p>
              L&apos;ensemble des &eacute;l&eacute;ments de la plateforme (design, textes, logos, fonctionnalit&eacute;s) est prot&eacute;g&eacute; par le droit de la propri&eacute;t&eacute; intellectuelle. Toute reproduction non autoris&eacute;e est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Protection des donn&eacute;es</h2>
            <p>
              Le traitement des donn&eacute;es personnelles est d&eacute;taill&eacute; dans notre{" "}
              <Link href="/politique-confidentialite" className="text-blue-600 hover:underline">
                Politique de confidentialit&eacute;
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Responsabilit&eacute;</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>La Brie Immobili&egrave;re ne garantit pas la disponibilit&eacute; continue de la plateforme.</li>
              <li>La Brie Immobili&egrave;re ne saurait &ecirc;tre tenue responsable des dommages indirects li&eacute;s &agrave; l&apos;utilisation de la plateforme.</li>
              <li>L&apos;utilisateur est seul responsable de l&apos;utilisation qu&apos;il fait de la plateforme.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. R&eacute;siliation</h2>
            <p>
              L&apos;utilisateur peut demander la suppression de son compte &agrave; tout moment depuis son profil ou en contactant l&apos;administration. La Brie Immobili&egrave;re se r&eacute;serve le droit de suspendre ou supprimer un compte en cas de non-respect des pr&eacute;sentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Modification des CGU</h2>
            <p>
              La Brie Immobili&egrave;re se r&eacute;serve le droit de modifier les pr&eacute;sentes CGU &agrave; tout moment. Les utilisateurs seront inform&eacute;s des modifications par notification sur la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Droit applicable</h2>
            <p>
              Les pr&eacute;sentes CGU sont soumises au droit fran&ccedil;ais. Tout litige sera soumis aux juridictions comp&eacute;tentes du ressort du si&egrave;ge social de La Brie Immobili&egrave;re.
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            Derni&egrave;re mise &agrave; jour : avril 2026
          </p>
        </div>
      </div>
    </div>
  );
}
