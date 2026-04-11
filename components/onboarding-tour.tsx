"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  target?: string; // CSS selector (optional, for future tooltip positioning)
}

const AMBASSADOR_STEPS: TourStep[] = [
  {
    title: "Bienvenue sur The Club ! \uD83C\uDF89",
    description: "Votre espace ambassadeur vous permet de recommander des contacts, suivre vos commissions et communiquer avec votre négociateur.",
  },
  {
    title: "Recommander un contact",
    description: "Cliquez sur « Recommander » dans le menu pour soumettre les coordonnées d'un contact ayant un projet immobilier. C'est rapide et simple !",
  },
  {
    title: "Suivre vos recommandations",
    description: "Dans « Mes recommandations », suivez l'avancement de chaque lead en temps réel. Vous êtes notifié à chaque changement de statut.",
  },
  {
    title: "Vos commissions",
    description: "La jauge sur votre tableau de bord montre vos gains acquis et potentiels. Consultez « Mes commissions » pour le détail.",
  },
  {
    title: "Partager l'agence",
    description: "Partagez les coordonnées de votre conseiller avec vos proches via SMS, WhatsApp ou les réseaux sociaux.",
  },
  {
    title: "Messagerie",
    description: "Communiquez directement avec votre négociateur et l'équipe depuis la messagerie intégrée.",
  },
  {
    title: "Notifications",
    description: "Activez les notifications push dans votre profil pour être alerté même quand l'app est fermée. Vous êtes prêt ! \uD83D\uDE80",
  },
];

const NEGOTIATOR_STEPS: TourStep[] = [
  {
    title: "Bienvenue sur The Club ! \uD83C\uDF89",
    description: "Votre espace négociateur vous permet de gérer les recommandations de vos ambassadeurs et de suivre vos performances.",
  },
  {
    title: "Vos recommandations",
    description: "Consultez et changez le statut des leads reçus de vos ambassadeurs. Chaque changement notifie l'ambassadeur automatiquement.",
  },
  {
    title: "Recruter des ambassadeurs",
    description: "Dans « Recrutement », partagez votre QR code et votre lien d'inscription pour recruter de nouveaux ambassadeurs.",
  },
  {
    title: "Messagerie & notifications",
    description: "Échangez avec vos ambassadeurs via la messagerie. Activez les notifications push pour ne rien rater !",
  },
];

export function OnboardingTour({ role }: { role: string }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  const steps = role === "NEGOTIATOR" ? NEGOTIATOR_STEPS : AMBASSADOR_STEPS;

  useEffect(() => {
    const key = `onboarding-tour-${role}`;
    const done = localStorage.getItem(key);
    if (!done) {
      // Show after a short delay to let the page load
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [role]);

  const handleFinish = () => {
    setShow(false);
    localStorage.setItem(`onboarding-tour-${role}`, "done");
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else handleFinish();
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white shadow-2xl overflow-hidden">
        {/* Close */}
        <button onClick={handleFinish} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Progress */}
        <div className="flex gap-1 px-6 pt-5">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? "bg-[#D1B280]" : "bg-gray-200"}`} />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#D1B280]" />
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              \u00C9tape {step + 1} / {steps.length}
            </p>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{steps[step].title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{steps[step].description}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Pr\u00e9c\u00e9dent
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleFinish} className="text-sm text-gray-400 hover:text-gray-600">
              Passer
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 bg-[#030A24] text-white text-sm font-medium hover:bg-[#0f1e40] transition-colors"
            >
              {step < steps.length - 1 ? (
                <>Suivant <ArrowRight className="w-4 h-4" /></>
              ) : (
                "C'est parti !"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
