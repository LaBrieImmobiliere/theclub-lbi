/**
 * Trigger haptic feedback on mobile devices
 * Types: light (button tap), medium (toggle), heavy (confirmation), success, error
 */
export function haptic(type: "light" | "medium" | "heavy" | "success" | "error" = "light") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;

  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [15, 50, 15],
    error: [50, 50, 50],
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch {
    /* ignore */
  }
}
