import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rejoindre The Club",
  description: "Créez votre compte ambassadeur gratuitement et commencez à recommander vos proches. 5% de commission sur chaque transaction immobilière réalisée.",
};

export default function RejoindreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
