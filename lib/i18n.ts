export type Locale = "fr" | "en";

const translations: Record<string, Record<Locale, string>> = {
  // Navigation
  "nav.dashboard": { fr: "Tableau de bord", en: "Dashboard" },
  "nav.recommend": { fr: "Recommander", en: "Recommend" },
  "nav.recommendations": { fr: "Mes recommandations", en: "My recommendations" },
  "nav.contracts": { fr: "Mes contrats", en: "My contracts" },
  "nav.commissions": { fr: "Mes commissions", en: "My commissions" },
  "nav.documents": { fr: "Mes documents", en: "My documents" },
  "nav.agency": { fr: "La Brie Immobilière", en: "La Brie Immobilière" },
  "nav.news": { fr: "Actualités", en: "News" },
  "nav.profile": { fr: "Mon profil", en: "My profile" },
  "nav.messages": { fr: "Messagerie", en: "Messages" },
  "nav.review": { fr: "Donner mon avis", en: "Leave a review" },
  "nav.help": { fr: "Aide & FAQ", en: "Help & FAQ" },
  "nav.logout": { fr: "Déconnexion", en: "Log out" },

  // Dashboard
  "dashboard.hello": { fr: "Bonjour", en: "Hello" },
  "dashboard.recommendations": { fr: "Recommandations", en: "Recommendations" },
  "dashboard.contracts": { fr: "Contrats", en: "Contracts" },
  "dashboard.totalCommissions": { fr: "Commissions totales", en: "Total commissions" },
  "dashboard.conversionRate": { fr: "Taux de conversion", en: "Conversion rate" },
  "dashboard.myActivity": { fr: "Mon activité (6 derniers mois)", en: "My activity (last 6 months)" },
  "dashboard.commissionMonth": { fr: "Commission du mois", en: "Commission this month" },
  "dashboard.ranking": { fr: "ambassadeurs", en: "ambassadors" },
  "dashboard.recentRecommendations": { fr: "Mes recommandations récentes", en: "My recent recommendations" },
  "dashboard.recentContracts": { fr: "Mes contrats récents", en: "My recent contracts" },
  "dashboard.viewAll": { fr: "Voir tout", en: "View all" },
  "dashboard.downloadReport": { fr: "Télécharger mon rapport mensuel", en: "Download my monthly report" },
  "dashboard.recommend": { fr: "Recommander un proche", en: "Recommend someone" },

  // Auth
  "auth.login": { fr: "SE CONNECTER", en: "LOG IN" },
  "auth.email": { fr: "Email", en: "Email" },
  "auth.password": { fr: "Mot de passe", en: "Password" },
  "auth.forgotPassword": { fr: "Mot de passe oublié ?", en: "Forgot password?" },
  "auth.magicLink": { fr: "Lien magique", en: "Magic link" },
  "auth.notAmbassador": { fr: "Pas encore ambassadeur ?", en: "Not an ambassador yet?" },
  "auth.joinFree": { fr: "Inscrivez-vous gratuitement et gagnez des commissions", en: "Sign up for free and earn commissions" },
  "auth.becomeAmbassador": { fr: "Devenir ambassadeur", en: "Become an ambassador" },

  // Common
  "common.loading": { fr: "Chargement...", en: "Loading..." },
  "common.save": { fr: "Enregistrer", en: "Save" },
  "common.cancel": { fr: "Annuler", en: "Cancel" },
  "common.delete": { fr: "Supprimer", en: "Delete" },
  "common.edit": { fr: "Modifier", en: "Edit" },
  "common.search": { fr: "Rechercher...", en: "Search..." },
  "common.noResults": { fr: "Aucun résultat", en: "No results" },
  "common.copy": { fr: "Copier", en: "Copy" },
  "common.copied": { fr: "Copié !", en: "Copied!" },
  "common.share": { fr: "Partager", en: "Share" },
  "common.send": { fr: "Envoyer", en: "Send" },
  "common.close": { fr: "Fermer", en: "Close" },
};

export function t(key: string, locale: Locale = "fr"): string {
  return translations[key]?.[locale] || translations[key]?.fr || key;
}

export function getLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  return (localStorage.getItem("locale") as Locale) || "fr";
}

export function setLocale(locale: Locale) {
  if (typeof window !== "undefined") {
    localStorage.setItem("locale", locale);
    window.location.reload();
  }
}
