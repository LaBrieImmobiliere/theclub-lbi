import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/bienvenue" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
          Politique de confidentialit&eacute;
        </h1>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des donn&eacute;es personnelles est :<br />
              <strong>La Brie Immobili&egrave;re</strong><br />
              41, avenue du Mar&eacute;chal de Lattre de Tassigny, 94440 Villecresnes<br />
              Email : contact@labrieimmobiliere.fr
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Donn&eacute;es collect&eacute;es</h2>
            <p>Dans le cadre de l&apos;utilisation de la plateforme The Club, nous collectons les donn&eacute;es suivantes :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Donn&eacute;es d&apos;identification :</strong> nom, pr&eacute;nom, adresse email, num&eacute;ro de t&eacute;l&eacute;phone</li>
              <li><strong>Donn&eacute;es de connexion :</strong> adresse IP, date et heure de connexion, navigateur utilis&eacute;</li>
              <li><strong>Donn&eacute;es professionnelles :</strong> r&ocirc;le (ambassadeur, n&eacute;gociateur), agence rattach&eacute;e, code de parrainage</li>
              <li><strong>Donn&eacute;es de recommandation :</strong> informations sur les prospects recommand&eacute;s (nom, t&eacute;l&eacute;phone, type de projet)</li>
              <li><strong>Donn&eacute;es financi&egrave;res :</strong> montant des commissions, statut des paiements</li>
              <li><strong>Messages :</strong> contenu des &eacute;changes via la messagerie int&eacute;gr&eacute;e</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Finalit&eacute;s du traitement</h2>
            <p>Vos donn&eacute;es personnelles sont trait&eacute;es pour les finalit&eacute;s suivantes :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Gestion de votre compte utilisateur et authentification</li>
              <li>Gestion du programme d&apos;ambassadeurs et des recommandations</li>
              <li>Calcul et suivi des commissions</li>
              <li>Communication entre ambassadeurs, n&eacute;gociateurs et administrateurs</li>
              <li>Envoi de notifications et d&apos;emails de service</li>
              <li>&Eacute;tablissement de contrats et de reconnaissances d&apos;honoraires</li>
              <li>Statistiques et reporting internes (anonymis&eacute;s)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Base l&eacute;gale du traitement</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Ex&eacute;cution du contrat :</strong> gestion de votre compte, programme ambassadeur, commissions</li>
              <li><strong>Int&eacute;r&ecirc;t l&eacute;gitime :</strong> am&eacute;lioration du service, s&eacute;curit&eacute; de la plateforme</li>
              <li><strong>Obligation l&eacute;gale :</strong> conservation des donn&eacute;es comptables et fiscales</li>
              <li><strong>Consentement :</strong> cookies non essentiels (le cas &eacute;ch&eacute;ant)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Dur&eacute;e de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Comptes actifs :</strong> donn&eacute;es conserv&eacute;es pendant toute la dur&eacute;e de la relation contractuelle</li>
              <li><strong>Comptes inactifs :</strong> supprim&eacute;s apr&egrave;s 3 ans d&apos;inactivit&eacute;</li>
              <li><strong>Donn&eacute;es comptables :</strong> conserv&eacute;es 10 ans (obligation l&eacute;gale)</li>
              <li><strong>Logs de connexion :</strong> conserv&eacute;s 1 an</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Destinataires des donn&eacute;es</h2>
            <p>Vos donn&eacute;es peuvent &ecirc;tre communiqu&eacute;es &agrave; :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Les employ&eacute;s habilit&eacute;s de La Brie Immobili&egrave;re (administrateurs, n&eacute;gociateurs)</li>
              <li>Notre h&eacute;bergeur : Vercel Inc. (donn&eacute;es stock&eacute;es dans l&apos;UE via AWS eu-west)</li>
              <li>Notre fournisseur de base de donn&eacute;es : Neon (PostgreSQL, serveurs UE)</li>
              <li>Notre fournisseur d&apos;emails : OVH (serveurs en France)</li>
            </ul>
            <p className="mt-2">Aucune donn&eacute;e n&apos;est vendue &agrave; des tiers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Vos droits (RGPD)</h2>
            <p>Conform&eacute;ment au R&egrave;glement G&eacute;n&eacute;ral sur la Protection des Donn&eacute;es (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Droit d&apos;acc&egrave;s :</strong> obtenir une copie de vos donn&eacute;es personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger vos donn&eacute;es depuis votre profil</li>
              <li><strong>Droit &agrave; l&apos;effacement :</strong> demander la suppression de votre compte</li>
              <li><strong>Droit &agrave; la portabilit&eacute; :</strong> exporter vos donn&eacute;es au format num&eacute;rique</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer &agrave; certains traitements</li>
              <li><strong>Droit &agrave; la limitation :</strong> limiter le traitement de vos donn&eacute;es</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, rendez-vous dans <strong>Mon profil</strong> sur la plateforme, ou contactez-nous &agrave; : <a href="mailto:contact@labrieimmobiliere.fr" className="text-blue-600 hover:underline">contact@labrieimmobiliere.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Cookies</h2>
            <p>
              La plateforme utilise uniquement des <strong>cookies strictement n&eacute;cessaires</strong> au fonctionnement du service :
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><code className="bg-gray-100 px-1 rounded text-xs">authjs.session-token</code> : session d&apos;authentification</li>
              <li><code className="bg-gray-100 px-1 rounded text-xs">authjs.csrf-token</code> : protection CSRF</li>
            </ul>
            <p className="mt-2">Aucun cookie de suivi, publicitaire ou analytique n&apos;est utilis&eacute; sans votre consentement explicite.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">9. S&eacute;curit&eacute;</h2>
            <p>
              Nous mettons en place les mesures techniques et organisationnelles suivantes pour prot&eacute;ger vos donn&eacute;es :
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Chiffrement des mots de passe (bcrypt)</li>
              <li>Communication chiffr&eacute;e (HTTPS/TLS)</li>
              <li>Acc&egrave;s restreint par r&ocirc;les (RBAC)</li>
              <li>Tokens JWT avec expiration</li>
              <li>Protection CSRF sur les formulaires</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">10. R&eacute;clamation</h2>
            <p>
              Si vous estimez que le traitement de vos donn&eacute;es ne respecte pas la r&eacute;glementation, vous pouvez adresser une r&eacute;clamation &agrave; la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libert&eacute;s) :
            </p>
            <p className="mt-2">
              CNIL — 3 Place de Fontenoy, 75007 Paris<br />
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.cnil.fr</a>
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
