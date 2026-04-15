/**
 * Module d'upload unifié : Vercel Blob en prod, filesystem en dev.
 *
 * Vercel n'a pas de filesystem persistant — les fichiers écrits dans public/
 * disparaissent au prochain cold start. On utilise donc @vercel/blob dès que
 * BLOB_READ_WRITE_TOKEN est présent (automatique quand un Blob Store est lié
 * au projet Vercel).
 *
 * En local (pas de token), fallback sur fs.writeFileSync dans public/ pour
 * garder le DX simple.
 */

import path from "path";
import fs from "fs";

export type UploadKind = "photos" | "documents";

/** Upload un fichier et renvoie son URL publique. */
export async function uploadFile(
  kind: UploadKind,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (useBlob) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${kind}/${filename}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob.url;
  }

  // Fallback local : public/photos/{filename} ou public/documents/{filename}
  const dirCandidates = [
    path.resolve(process.cwd(), `public/${kind}`),
    path.resolve(process.cwd(), `app-lbi/public/${kind}`),
  ];
  let dir = dirCandidates[0];
  for (const p of dirCandidates) {
    if (fs.existsSync(p)) { dir = p; break; }
  }
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/${kind}/${filename}`;
}

/** Supprime un fichier (best effort). Accepte URL Blob ou chemin local /kind/xxx. */
export async function deleteFile(url: string): Promise<void> {
  const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (useBlob && url.startsWith("http")) {
    try {
      const { del } = await import("@vercel/blob");
      await del(url);
    } catch {
      // best effort — on ne bloque pas l'utilisateur si l'asset est déjà supprimé
    }
    return;
  }

  // Fallback local
  try {
    if (!url.startsWith("/")) return;
    const [, kind, filename] = url.split("/");
    if (!kind || !filename) return;
    const candidates = [
      path.resolve(process.cwd(), `public/${kind}`, filename),
      path.resolve(process.cwd(), `app-lbi/public/${kind}`, filename),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) { fs.unlinkSync(p); break; }
    }
  } catch {
    // best effort
  }
}
