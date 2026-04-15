import { prisma } from "@/lib/prisma";

/**
 * Règles d'accès à la messagerie :
 * - ADMIN       : peut écrire à tout le monde
 * - NEGOTIATOR  : peut écrire à ses ambassadeurs (liés via Ambassador.negotiatorId, status ACTIVE)
 *                 + aux admins (pour l'escalade interne)
 * - AMBASSADOR  : peut écrire à son négociateur assigné + aux admins
 *
 * Ces règles sont appliquées à la fois pour la recherche d'utilisateurs
 * (/api/users) et pour la validation à l'envoi d'un message (/api/messages POST).
 */

export type MessagingRole = "ADMIN" | "NEGOTIATOR" | "AMBASSADOR";

/**
 * Renvoie la liste des IDs utilisateurs joignables par `currentUserId`.
 * Pour l'admin, renvoie `null` (= pas de restriction).
 */
export async function reachableUserIds(
  currentUserId: string,
  role: string,
): Promise<string[] | null> {
  if (role === "ADMIN") return null;

  // Admins — toujours accessibles pour nego et ambassador
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const adminIds = admins.map((a) => a.id);

  if (role === "NEGOTIATOR") {
    const negotiator = await prisma.negotiator.findUnique({
      where: { userId: currentUserId },
      include: {
        ambassadors: {
          where: { status: "ACTIVE" },
          select: { userId: true },
        },
      },
    });
    const ambassadorIds = negotiator?.ambassadors.map((a) => a.userId) ?? [];
    return [...new Set([...adminIds, ...ambassadorIds])];
  }

  if (role === "AMBASSADOR") {
    const ambassador = await prisma.ambassador.findUnique({
      where: { userId: currentUserId },
      include: { negotiator: { select: { userId: true } } },
    });
    const negotiatorUserId = ambassador?.negotiator?.userId;
    const ids = negotiatorUserId ? [negotiatorUserId, ...adminIds] : adminIds;
    return [...new Set(ids)];
  }

  // Rôle inconnu → aucun contact autorisé
  return [];
}

/**
 * Vérifie si `currentUserId` (avec rôle `role`) peut envoyer un message à `targetUserId`.
 */
export async function canMessage(
  currentUserId: string,
  role: string,
  targetUserId: string,
): Promise<boolean> {
  if (currentUserId === targetUserId) return false;
  const ids = await reachableUserIds(currentUserId, role);
  if (ids === null) return true; // admin
  return ids.includes(targetUserId);
}
