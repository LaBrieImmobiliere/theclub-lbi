"use client";

/**
 * Carte "Votre progression" — niveau Bronze/Silver/Gold + badges débloqués + classement.
 * Calcul dérivé des stats réelles de l'ambassadeur (ventes signées, recos, gains).
 */

import { Award, Lock, Trophy, Sparkles } from "lucide-react";

interface Props {
  totalLeads: number;        // nb de recommandations
  totalContracts: number;    // nb de ventes signées (contrats)
  totalCommissions: number;  // gains totaux cumulés
  rank: number;              // classement 1-based (0 = non classé)
  totalRanked: number;       // nb total d'ambassadeurs actifs
}

type Level = {
  key: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  label: string;
  min: number;         // ventes minimum
  next?: number;       // seuil suivant
  color: string;       // hex / tailwind class suffixes
  gradient: string;    // bg gradient classes
  textOn: string;      // text on gradient
  emoji: string;
};

const LEVELS: Level[] = [
  { key: "BRONZE",   label: "Bronze",   min: 0,  next: 3,   color: "#CD7F32", gradient: "from-[#8B4513] via-[#CD7F32] to-[#E8A868]", textOn: "text-white",      emoji: "🥉" },
  { key: "SILVER",   label: "Silver",   min: 3,  next: 10,  color: "#9CA3AF", gradient: "from-[#6B7280] via-[#9CA3AF] to-[#D1D5DB]", textOn: "text-white",      emoji: "🥈" },
  { key: "GOLD",     label: "Gold",     min: 10, next: 25,  color: "#D1B280", gradient: "from-[#8B6914] via-[#D1B280] to-[#F4D08C]", textOn: "text-white",      emoji: "🥇" },
  { key: "PLATINUM", label: "Platinum", min: 25,            color: "#4F46E5", gradient: "from-[#1E1B4B] via-[#4F46E5] to-[#A5B4FC]", textOn: "text-white",      emoji: "💎" },
];

function levelFor(contracts: number): Level {
  // reverse: find highest level whose min <= contracts
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (contracts >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

interface BadgeDef {
  key: string;
  label: string;
  desc: string;
  emoji: string;
  earned: boolean;
}

function buildBadges(p: Props): BadgeDef[] {
  return [
    { key: "FIRST_RECO",    label: "1ère reco",      desc: "Première recommandation transmise",  emoji: "📩", earned: p.totalLeads >= 1 },
    { key: "FIVE_RECOS",    label: "5 recos",         desc: "5 recommandations transmises",         emoji: "📬", earned: p.totalLeads >= 5 },
    { key: "TEN_RECOS",     label: "10 recos",        desc: "10 recommandations transmises",        emoji: "📨", earned: p.totalLeads >= 10 },
    { key: "FIRST_SALE",    label: "1ère vente",      desc: "Première vente conclue",               emoji: "🏠", earned: p.totalContracts >= 1 },
    { key: "FIVE_SALES",    label: "5 ventes",        desc: "5 ventes conclues",                    emoji: "🏘️", earned: p.totalContracts >= 5 },
    { key: "TEN_SALES",     label: "10 ventes",       desc: "10 ventes conclues",                   emoji: "🏛️", earned: p.totalContracts >= 10 },
    { key: "FIRST_EURO",    label: "1er gain",        desc: "Première commission versée",           emoji: "💶", earned: p.totalCommissions >= 1 },
    { key: "GRAND",         label: "1 000 € gagnés",  desc: "1 000 € de gains cumulés",             emoji: "💰", earned: p.totalCommissions >= 1000 },
    { key: "FIVE_GRAND",    label: "5 000 € gagnés",  desc: "5 000 € de gains cumulés",             emoji: "💎", earned: p.totalCommissions >= 5000 },
    { key: "TOP_10",        label: "Top 10",          desc: "Dans le top 10 des ambassadeurs",      emoji: "🏆", earned: p.rank > 0 && p.rank <= 10 },
    { key: "TOP_3",         label: "Top 3",           desc: "Dans le top 3 des ambassadeurs",       emoji: "🌟", earned: p.rank > 0 && p.rank <= 3 },
    { key: "NUMBER_ONE",    label: "N°1",             desc: "Premier du classement",                emoji: "👑", earned: p.rank === 1 },
  ];
}

export function GamificationCard(p: Props) {
  const current = levelFor(p.totalContracts);
  const currentIdx = LEVELS.findIndex((l) => l.key === current.key);
  const nextLevel = LEVELS[currentIdx + 1];
  const toNext = nextLevel ? Math.max(0, nextLevel.min - p.totalContracts) : 0;
  const prevMin = current.min;
  const nextMin = nextLevel?.min ?? current.min;
  const progress = nextLevel
    ? Math.min(100, Math.round(((p.totalContracts - prevMin) / (nextMin - prevMin)) * 100))
    : 100;

  const badges = buildBadges(p);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header gradient niveau */}
      <div className={`bg-gradient-to-br ${current.gradient} px-5 py-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl shadow-inner">
              {current.emoji}
            </div>
            <div>
              <p className={`text-[11px] uppercase tracking-widest font-semibold opacity-80 ${current.textOn}`}>
                Votre niveau
              </p>
              <p className={`text-2xl font-bold ${current.textOn}`}>{current.label}</p>
            </div>
          </div>
          {p.rank > 0 && (
            <div className="text-right">
              <p className={`text-[11px] uppercase tracking-widest font-semibold opacity-80 ${current.textOn}`}>
                Classement
              </p>
              <p className={`text-2xl font-bold ${current.textOn}`}>
                #{p.rank}
                <span className="text-sm font-normal opacity-70"> / {p.totalRanked}</span>
              </p>
            </div>
          )}
        </div>

        {/* Barre vers niveau suivant */}
        {nextLevel && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className={`text-xs ${current.textOn} opacity-90`}>
                Plus que <strong>{toNext} vente{toNext > 1 ? "s" : ""}</strong> pour passer{" "}
                <span className="font-semibold">{nextLevel.label}</span> {nextLevel.emoji}
              </p>
              <p className={`text-xs font-semibold ${current.textOn}`}>{progress}%</p>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {!nextLevel && (
          <div className="mt-5 flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4" />
            <p className="text-xs opacity-90">
              Niveau maximum atteint — bravo, vous êtes dans l&apos;élite ambassadeur !
            </p>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D1B280]" />
            <h3 className="font-semibold text-gray-900 text-sm">Vos badges</h3>
          </div>
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{earnedCount}</span> / {badges.length} débloqués
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {badges.map((b) => (
            <div
              key={b.key}
              title={`${b.label} — ${b.desc}`}
              className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                b.earned
                  ? "bg-gradient-to-br from-[#f9f6f1] to-white border-[#D1B280]/40 shadow-sm"
                  : "bg-gray-50 border-gray-100 opacity-60"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                  b.earned ? "bg-white shadow" : "bg-gray-100"
                }`}
              >
                {b.earned ? b.emoji : <Lock className="w-4 h-4 text-gray-400" />}
              </div>
              <p
                className={`text-[10px] text-center font-medium leading-tight ${
                  b.earned ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {b.label}
              </p>
            </div>
          ))}
        </div>

        {earnedCount === 0 && (
          <div className="bg-brand-cream/60 border-l-2 border-brand-gold px-4 py-3 text-xs text-gray-600 leading-relaxed mt-2">
            <Trophy className="w-4 h-4 text-brand-gold inline-block mr-1 -mt-0.5" />
            Transmettez votre première recommandation pour débloquer votre premier badge !
          </div>
        )}
      </div>
    </div>
  );
}
