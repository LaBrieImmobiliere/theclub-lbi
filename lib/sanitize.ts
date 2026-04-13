/**
 * Strip HTML tags and dangerous characters from user input
 */
export function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "&": "&amp;",
      };
      return entities[char] || char;
    })
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone number (French format)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.-]/g, "");
  return /^(\+33|0)[1-9]\d{8}$/.test(cleaned);
}
