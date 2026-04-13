"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, Download } from "lucide-react";

interface OnboardingStep {
  emoji: string;
  title: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  {
    emoji: "\uD83C\uDF89",
    title: "Bienvenue sur The Club",
    description:
      "Vous faites d\u00e9sormais partie du r\u00e9seau d\u2019ambassadeurs de La Brie Immobili\u00e8re. Recommandez vos proches ayant un projet immobilier et touchez une commission sur chaque transaction aboutie !",
  },
  {
    emoji: "\uD83D\uDCE8",
    title: "Recommandez",
    description:
      "Cliquez sur \u00ab Recommander \u00bb dans le menu pour soumettre les coordonn\u00e9es d\u2019un contact. Renseignez son nom, t\u00e9l\u00e9phone et type de projet. C\u2019est rapide, simple, et votre n\u00e9gociateur le contactera sous 48h.",
  },
  {
    emoji: "\uD83D\uDCB0",
    title: "Suivez et gagnez",
    description:
      "Suivez l\u2019avancement de vos recommandations en temps r\u00e9el depuis votre tableau de bord. D\u00e8s qu\u2019une transaction aboutit, vous touchez 5% des honoraires d\u2019agence directement sur votre compte bancaire.",
  },
  {
    emoji: "\uD83D\uDCF1",
    title: "Installez l\u2019app",
    description:
      "Acc\u00e9dez \u00e0 The Club comme une vraie application mobile !\n\nSur iPhone : Safari \u2192 bouton Partager \u2192 \u00ab Sur l\u2019\u00e9cran d\u2019accueil \u00bb\nSur Android : Menu \u22ee \u2192 \u00ab Ajouter \u00e0 l\u2019\u00e9cran d\u2019accueil \u00bb",
  },
];

interface OnboardingModalProps {
  onComplete?: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem("onboarding-modal-done");
    if (!done) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleFinish = useCallback(() => {
    setShow(false);
    localStorage.setItem("onboarding-modal-done", "true");
    onComplete?.();
  }, [onComplete]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleFinish} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f1e40] shadow-2xl rounded-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleFinish}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Emoji illustration */}
        <div className="flex items-center justify-center pt-8 pb-2">
          <div className="w-20 h-20 bg-[#D1B280]/10 rounded-2xl flex items-center justify-center">
            <span className="text-5xl">{current.emoji}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 text-center">
          <p className="text-xs text-[#D1B280] font-semibold uppercase tracking-widest mb-2">
            {`ÉTAPE ${step + 1} SUR ${STEPS.length}`}
          </p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {current.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {current.description}
          </p>
        </div>

        {/* Dots navigation */}
        <div className="flex items-center justify-center gap-2 py-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === step
                  ? "w-6 bg-[#D1B280]"
                  : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button
            onClick={handleFinish}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Passer
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#030A24] dark:bg-[#D1B280] text-white dark:text-[#030A24] text-sm font-semibold hover:bg-[#0f1e40] dark:hover:bg-[#b89a65] transition-colors rounded-lg"
          >
            {isLast ? (
              <>
                Terminer
                <Download className="w-4 h-4" />
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
