import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/bienvenue" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Mentions l&eacute;gales
        </h1>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">&Eacute;diteur du site</h2>
            <p>
              Le site <strong>The Club</strong> (theclub.labrieimmobiliere.fr) est &eacute;dit&eacute; par :<br />
              <strong>La Brie Immobili&egrave;re</strong><br />
              Soci&eacute;t&eacute; par actions simplifi&eacute;e (SAS)<br />
              Si&egrave;ge social : 41, avenue du Mar&eacute;chal de Lattre de Tassigny, 94440 Villecresnes<br />
              T&eacute;l&eacute;phone : 01 45 95 95 95<br />
              Email : contact@labrieimmobiliere.fr<br />
              Num&eacute;ro RCS : [&agrave; compl&eacute;ter]<br />
              Num&eacute;ro SIRET : [&agrave; compl&eacute;ter]<br />
              Num&eacute;ro TVA intracommunautaire : [&agrave; compl&eacute;ter]<br />
              Carte professionnelle : [&agrave; compl&eacute;ter] d&eacute;livr&eacute;e par la CCI<br />
              Directeur de la publication : [&agrave; compl&eacute;ter]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">H&eacute;bergeur</h2>
            <p>
              Le site est h&eacute;berg&eacute; par :<br />
              <strong>Vercel Inc.</strong><br />
              440 N Bashaw St, Covina, CA 91723, &Eacute;tats-Unis<br />
              Site web : vercel.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Propri&eacute;t&eacute; intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu du site (textes, images, graphismes, logo, ic&ocirc;nes, sons, logiciels, etc.) est la propri&eacute;t&eacute; exclusive de La Brie Immobili&egrave;re ou de ses partenaires. Toute reproduction, repr&eacute;sentation, modification, publication, transmission, ou d&eacute;naturation, totale ou partielle, du site ou de son contenu, par quelque proc&eacute;d&eacute; que ce soit, et sur quelque support que ce soit, est interdite sans l&apos;autorisation &eacute;crite pr&eacute;alable de La Brie Immobili&egrave;re.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Responsabilit&eacute;</h2>
            <p>
              La Brie Immobili&egrave;re s&apos;efforce de fournir des informations aussi pr&eacute;cises que possible. Toutefois, elle ne saurait &ecirc;tre tenue responsable des omissions, des inexactitudes ou des carences dans la mise &agrave; jour de ces informations, qu&apos;elles soient de son fait ou du fait de tiers fournissant ces informations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Donn&eacute;es personnelles</h2>
            <p>
              Pour plus d&apos;informations sur le traitement de vos donn&eacute;es personnelles, veuillez consulter notre{" "}
              <Link href="/politique-confidentialite" className="text-blue-600 hover:underline">
                Politique de confidentialit&eacute;
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Cookies</h2>
            <p>
              Le site utilise des cookies strictement n&eacute;cessaires au fonctionnement du service (authentification, session utilisateur). Aucun cookie de suivi publicitaire ou analytique n&apos;est utilis&eacute; sans votre consentement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Droit applicable</h2>
            <p>
              Les pr&eacute;sentes mentions l&eacute;gales sont r&eacute;gies par le droit fran&ccedil;ais. En cas de litige, et &agrave; d&eacute;faut de r&eacute;solution amiable, les tribunaux fran&ccedil;ais seront seuls comp&eacute;tents.
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
