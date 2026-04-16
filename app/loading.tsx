/**
 * Fallback Suspense global : s'affiche pendant le chargement d'une route.
 * Design cohérent avec le splash screen (logo + barre gold).
 */
export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <img
        src="/logo-gold.png"
        alt=""
        width={80}
        height={80}
        className="animate-pulse"
      />
      <div className="w-12 h-[3px] bg-brand-gold/20 rounded overflow-hidden">
        <div
          className="h-full w-1/2 bg-brand-gold rounded"
          style={{ animation: "splashSlide 1s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
