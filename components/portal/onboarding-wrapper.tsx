"use client";

import { useState, useEffect } from "react";
import { OnboardingTour } from "@/components/portal/onboarding-tour";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const [showTour, setShowTour] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((user) => {
        if (user && user.onboarded === false) {
          setShowTour(true);
        }
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  const handleComplete = async () => {
    setShowTour(false);
    try {
      await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarded: true }),
      });
    } catch {
      // silently handle error
    }
  };

  if (!loaded) return <>{children}</>;

  return (
    <>
      {showTour && <OnboardingTour onComplete={handleComplete} />}
      {children}
    </>
  );
}
