import { Sparkles, TrendingUp, Target, Award, Rocket, Coffee } from "lucide-react";

interface Props {
  name: string;
  totalLeads: number;
  totalContracts: number;
  totalEarned: number;
  daysSinceLastLead: number;
}

/**
 * Affiche un message personnalisé selon l'activité de l'ambassadeur
 */
export function PersonalizedGreeting({ name, totalLeads, totalContracts, totalEarned, daysSinceLastLead }: Props) {
  const firstName = name.split(" ")[0] || name;
  let greeting: { icon: typeof Sparkles; title: string; message: string; color: string };

  if (totalLeads === 0) {
    // Débutant
    greeting = {
      icon: Rocket,
      title: `Bienvenue ${firstName} !`,
      message: "Prêt à recommander votre premier contact ? Chaque recommandation vous rapproche de votre première commission 💰",
      color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    };
  } else if (totalLeads < 3) {
    // Actif débutant
    greeting = {
      icon: Target,
      title: `Continuez comme ça, ${firstName} !`,
      message: `Vous avez déjà ${totalLeads} recommandation${totalLeads > 1 ? "s" : ""}. Chaque nouveau contact augmente vos chances.`,
      color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30",
    };
  } else if (daysSinceLastLead > 30 && totalLeads > 0) {
    // Inactif
    greeting = {
      icon: Coffee,
      title: `${firstName}, vous nous manquez !`,
      message: `Cela fait ${daysSinceLastLead} jours depuis votre dernière recommandation. Une idée en tête ? 👀`,
      color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    };
  } else if (totalContracts >= 5) {
    // Top performer
    greeting = {
      icon: Award,
      title: `${firstName}, vous êtes une star ! ⭐`,
      message: `${totalContracts} contrats signés grâce à vous. Vous faites partie de notre top ambassadeurs !`,
      color: "from-[#D1B280]/30 to-[#D1B280]/10 border-[#D1B280]/40",
    };
  } else if (totalEarned > 0) {
    // Actif confirmé
    greeting = {
      icon: TrendingUp,
      title: `Super activité, ${firstName} !`,
      message: `Vous avez déjà touché des commissions. Continuez sur cette lancée 🚀`,
      color: "from-green-500/20 to-green-600/10 border-green-500/30",
    };
  } else {
    // Actif avec recos mais pas encore de gains
    greeting = {
      icon: Sparkles,
      title: `Bonjour ${firstName} !`,
      message: `${totalLeads} recommandation${totalLeads > 1 ? "s" : ""} en cours. Vos prochaines commissions arrivent bientôt.`,
      color: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    };
  }

  const Icon = greeting.icon;

  return (
    <div className={`bg-gradient-to-br ${greeting.color} border rounded-xl p-5`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-[#D1B280]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            {greeting.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {greeting.message}
          </p>
        </div>
      </div>
    </div>
  );
}
