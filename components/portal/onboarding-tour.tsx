"use client";

import { useState } from "react";
import { Gift, UserPlus, BarChart2, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingTourProps {
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Gift,
    title: "Bienvenue dans The Club\u00a0!",
    description:
      "Vous faites d\u00e9sormais partie de notre programme ambassadeur. " +
      "Recommandez vos proches et gagnez des commissions sur chaque transaction r\u00e9alis\u00e9e gr\u00e2ce \u00e0 vous.",
  },
  {
    icon: UserPlus,
    title: "Recommandez vos proches",
    description:
      "Soumettez les coordonn\u00e9es de vos proches int\u00e9ress\u00e9s par un achat, " +
      "une vente ou une location. Notre \u00e9quipe prendra contact avec eux rapidement.",
  },
  {
    icon: BarChart2,
    title: "Suivez vos recommandations",
    description:
      "Consultez en temps r\u00e9el le statut de chacune de vos recommandations\u00a0: " +
      "nouveau, contact\u00e9, en cours ou sign\u00e9. Restez inform\u00e9 \u00e0 chaque \u00e9tape.",
  },
  {
    icon: Euro,
    title: "Gagnez des commissions",
    description:
      "D\u00e8s qu\u2019un contrat est sign\u00e9 gr\u00e2ce \u00e0 votre recommandation, " +
      "vous recevez une commission. Suivez vos gains directement depuis votre tableau de bord.",
  },
];

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header gradient */}
        <div className="bg-[#030A24] px-8 pt-10 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D1B280]/20 mb-4">
            <Icon className="w-8 h-8 text-[#D1B280]" />
          </div>
          <h2 className="text-xl font-bold text-white">{current.title}</h2>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <p className="text-gray-600 text-center leading-relaxed">
            {current.description}
          </p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 bg-[#D1B280]"
                    : "w-2 bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={onComplete}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Passer
            </button>

            {isLast ? (
              <Button onClick={onComplete}>
                C&apos;est parti&nbsp;!
              </Button>
            ) : (
              <Button onClick={() => setStep(step + 1)}>
                Suivant
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
