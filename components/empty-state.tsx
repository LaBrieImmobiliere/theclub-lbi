import { ClipboardList, MessageSquare, FileText, Users, Bell, Search } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  type: "recommandations" | "contrats" | "messages" | "ambassadeurs" | "notifications" | "search";
  action?: { label: string; href: string };
}

const CONFIGS: Record<string, { icon: typeof ClipboardList; title: string; description: string; emoji: string }> = {
  recommandations: {
    icon: ClipboardList,
    title: "Aucune recommandation",
    description: "Commencez par recommander un contact ayant un projet immobilier.",
    emoji: "\uD83D\uDCCB",
  },
  contrats: {
    icon: FileText,
    title: "Aucun contrat",
    description: "Vos contrats apparaîtront ici une fois créés.",
    emoji: "\uD83D\uDCC4",
  },
  messages: {
    icon: MessageSquare,
    title: "Aucun message",
    description: "Sélectionnez une conversation pour commencer à échanger.",
    emoji: "\uD83D\uDCAC",
  },
  ambassadeurs: {
    icon: Users,
    title: "Aucun ambassadeur",
    description: "Partagez votre lien de recrutement pour inviter des ambassadeurs.",
    emoji: "\uD83D\uDC65",
  },
  notifications: {
    icon: Bell,
    title: "Aucune notification",
    description: "Vous êtes à jour ! Les nouvelles notifications apparaîtront ici.",
    emoji: "\uD83D\uDD14",
  },
  search: {
    icon: Search,
    title: "Aucun résultat",
    description: "Essayez avec d'autres termes de recherche.",
    emoji: "\uD83D\uDD0D",
  },
};

export function EmptyState({ type, action }: EmptyStateProps) {
  const config = CONFIGS[type] || CONFIGS.recommandations;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
        <span className="text-3xl">{config.emoji}</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{config.title}</h3>
      <p className="text-xs text-gray-500 max-w-xs">{config.description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#030A24] text-white text-sm font-medium hover:bg-[#0f1e40] transition-colors"
        >
          <Icon className="w-4 h-4" />
          {action.label}
        </Link>
      )}
    </div>
  );
}
