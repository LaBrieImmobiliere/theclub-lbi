/**
 * Script de migration SQLite → PostgreSQL (Neon)
 * Usage: node scripts/migrate-data.mjs
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

// ─── Initialisation Prisma ────────────────────────────────────────────────────
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SQLITE_PATH = "/Users/alexandrebrites/Desktop/APP LBI/app-lbi/dev.db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Exécute une requête SQLite et retourne le résultat parsé en JSON.
 * SQLite stocke les booléens en 0/1 et les dates en string ISO.
 */
function querySQLite(table) {
  try {
    const output = execSync(
      `sqlite3 "${SQLITE_PATH}" -json "SELECT * FROM \\"${table}\\";"`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();

    if (!output || output === "") return [];
    return JSON.parse(output);
  } catch (err) {
    // La table n'existe peut-être pas dans la DB SQLite
    const msg = err.stderr?.toString() || err.message;
    if (msg.includes("no such table")) {
      console.log(`  ⚠  Table "${table}" absente de SQLite — ignorée.`);
      return [];
    }
    throw err;
  }
}

/**
 * Convertit une valeur SQLite en valeur JS correcte.
 * - Booléens: 0/1 → false/true
 * - Dates ISO string → Date JS (ou null si vide)
 * - null reste null
 */
function coerce(value, type = "string") {
  if (value === null || value === undefined) return null;
  if (type === "bool") return value === 1 || value === true || value === "1";
  if (type === "date") {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (type === "float") {
    if (value === null || value === undefined || value === "") return null;
    return parseFloat(value);
  }
  return value;
}

function log(msg) {
  console.log(msg);
}

// ─── Migration par table ──────────────────────────────────────────────────────

async function migrateAgency() {
  const rows = querySQLite("Agency");
  log(`\n[Agency] ${rows.length} ligne(s) trouvée(s) dans SQLite`);
  if (!rows.length) return 0;

  let count = 0;
  for (const r of rows) {
    await prisma.agency.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        name: r.name,
        code: r.code,
        address: r.address,
        postalCode: r.postalCode,
        city: r.city,
        phone: r.phone ?? null,
        email: r.email ?? null,
        createdAt: coerce(r.createdAt, "date") ?? new Date(),
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
      update: {
        name: r.name,
        code: r.code,
        address: r.address,
        postalCode: r.postalCode,
        city: r.city,
        phone: r.phone ?? null,
        email: r.email ?? null,
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
    });
    count++;
  }
  log(`  ✓ ${count} Agency insérée(s)/mise(s) à jour`);
  return count;
}

async function migrateUser() {
  const rows = querySQLite("User");
  log(`\n[User] ${rows.length} ligne(s) trouvée(s) dans SQLite`);
  if (!rows.length) return 0;

  let count = 0;
  for (const r of rows) {
    await prisma.user.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        name: r.name ?? null,
        email: r.email,
        emailVerified: coerce(r.emailVerified, "date"),
        image: r.image ?? null,
        password: r.password ?? null,
        role: r.role ?? "AMBASSADOR",
        phone: r.phone ?? null,
        onboarded: coerce(r.onboarded, "bool") ?? false,
        createdAt: coerce(r.createdAt, "date") ?? new Date(),
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
      update: {
        name: r.name ?? null,
        emailVerified: coerce(r.emailVerified, "date"),
        image: r.image ?? null,
        password: r.password ?? null,
        role: r.role ?? "AMBASSADOR",
        phone: r.phone ?? null,
        onboarded: coerce(r.onboarded, "bool") ?? false,
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
    });
    count++;
  }
  log(`  ✓ ${count} User inséré(s)/mis à jour`);
  return count;
}

async function migrateNegotiator() {
  const rows = querySQLite("Negotiator");
  log(`\n[Negotiator] ${rows.length} ligne(s) trouvée(s) dans SQLite`);
  if (!rows.length) return 0;

  let count = 0;
  for (const r of rows) {
    await prisma.negotiator.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        userId: r.userId,
        agencyId: r.agencyId,
        code: r.code,
        status: r.status ?? "ACTIVE",
        createdAt: coerce(r.createdAt, "date") ?? new Date(),
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
      update: {
        agencyId: r.agencyId,
        code: r.code,
        status: r.status ?? "ACTIVE",
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
    });
    count++;
  }
  log(`  ✓ ${count} Negotiator inséré(s)/mis à jour`);
  return count;
}

async function migrateAmbassador() {
  const rows = querySQLite("Ambassador");
  log(`\n[Ambassador] ${rows.length} ligne(s) trouvée(s) dans SQLite`);
  if (!rows.length) return 0;

  let count = 0;
  for (const r of rows) {
    await prisma.ambassador.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        userId: r.userId,
        code: r.code,
        agencyId: r.agencyId ?? null,
        negotiatorId: r.negotiatorId ?? null,
        status: r.status ?? "ACTIVE",
        notes: r.notes ?? null,
        createdAt: coerce(r.createdAt, "date") ?? new Date(),
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
      update: {
        code: r.code,
        agencyId: r.agencyId ?? null,
        negotiatorId: r.negotiatorId ?? null,
        status: r.status ?? "ACTIVE",
        notes: r.notes ?? null,
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
    });
    count++;
  }
  log(`  ✓ ${count} Ambassador inséré(s)/mis à jour`);
  return count;
}

async function migrateLead() {
  const rows = querySQLite("Lead");
  log(`\n[Lead] ${rows.length} ligne(s) trouvée(s) dans SQLite`);
  if (!rows.length) return 0;

  let count = 0;
  for (const r of rows) {
    await prisma.lead.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        ambassadorId: r.ambassadorId,
        agencyId: r.agencyId ?? null,
        negotiatorId: r.negotiatorId ?? null,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email ?? null,
        phone: r.phone,
        type: r.type,
        description: r.description ?? null,
        budget: r.budget ?? null,
        location: r.location ?? null,
        status: r.status ?? "NOUVEAU",
        notes: r.notes ?? null,
        createdAt: coerce(r.createdAt, "date") ?? new Date(),
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
      update: {
        agencyId: r.agencyId ?? null,
        negotiatorId: r.negotiatorId ?? null,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email ?? null,
        phone: r.phone,
        type: r.type,
        description: r.description ?? null,
        budget: r.budget ?? null,
        location: r.location ?? null,
        status: r.status ?? "NOUVEAU",
        notes: r.notes ?? null,
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
    });
    count++;
  }
  log(`  ✓ ${count} Lead inséré(s)/mis à jour`);
  return count;
}

async function migrateContract() {
  const rows = querySQLite("Contract");
  log(`\n[Contract] ${rows.length} ligne(s) trouvée(s) dans SQLite`);
  if (!rows.length) return 0;

  let count = 0;
  for (const r of rows) {
    await prisma.contract.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        ambassadorId: r.ambassadorId,
        leadId: r.leadId ?? null,
        number: r.number,
        commissionType: r.commissionType,
        commissionValue: coerce(r.commissionValue, "float") ?? 0,
        propertyAddress: r.propertyAddress ?? null,
        propertyPrice: coerce(r.propertyPrice, "float"),
        honoraires: coerce(r.honoraires, "float"),
        commissionAmount: coerce(r.commissionAmount, "float"),
        status: r.status ?? "BROUILLON",
        signedAt: coerce(r.signedAt, "date"),
        paidAt: coerce(r.paidAt, "date"),
        ambassadorSignature: r.ambassadorSignature ?? null,
        adminSignature: r.adminSignature ?? null,
        pdfPath: r.pdfPath ?? null,
        notes: r.notes ?? null,
        createdAt: coerce(r.createdAt, "date") ?? new Date(),
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
      update: {
        leadId: r.leadId ?? null,
        number: r.number,
        commissionType: r.commissionType,
        commissionValue: coerce(r.commissionValue, "float") ?? 0,
        propertyAddress: r.propertyAddress ?? null,
        propertyPrice: coerce(r.propertyPrice, "float"),
        honoraires: coerce(r.honoraires, "float"),
        commissionAmount: coerce(r.commissionAmount, "float"),
        status: r.status ?? "BROUILLON",
        signedAt: coerce(r.signedAt, "date"),
        paidAt: coerce(r.paidAt, "date"),
        ambassadorSignature: r.ambassadorSignature ?? null,
        adminSignature: r.adminSignature ?? null,
        pdfPath: r.pdfPath ?? null,
        notes: r.notes ?? null,
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
    });
    count++;
  }
  log(`  ✓ ${count} Contract inséré(s)/mis à jour`);
  return count;
}

async function migrateHonoraryAcknowledgment() {
  const rows = querySQLite("HonoraryAcknowledgment");
  log(`\n[HonoraryAcknowledgment] ${rows.length} ligne(s) trouvée(s) dans SQLite`);
  if (!rows.length) return 0;

  let count = 0;
  for (const r of rows) {
    await prisma.honoraryAcknowledgment.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        contractId: r.contractId,
        number: r.number,
        amount: coerce(r.amount, "float") ?? 0,
        description: r.description ?? null,
        status: r.status ?? "EN_ATTENTE",
        paidAt: coerce(r.paidAt, "date"),
        paymentRef: r.paymentRef ?? null,
        ambassadorSignature: r.ambassadorSignature ?? null,
        createdAt: coerce(r.createdAt, "date") ?? new Date(),
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
      update: {
        amount: coerce(r.amount, "float") ?? 0,
        description: r.description ?? null,
        status: r.status ?? "EN_ATTENTE",
        paidAt: coerce(r.paidAt, "date"),
        paymentRef: r.paymentRef ?? null,
        ambassadorSignature: r.ambassadorSignature ?? null,
        updatedAt: coerce(r.updatedAt, "date") ?? new Date(),
      },
    });
    count++;
  }
  log(`  ✓ ${count} HonoraryAcknowledgment inséré(s)/mis à jour`);
  return count;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     Migration SQLite → PostgreSQL (Neon)         ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\nSource : ${SQLITE_PATH}`);
  console.log(`Cible  : ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":****@")}\n`);

  // Vérifier que sqlite3 CLI est disponible
  try {
    execSync("sqlite3 --version", { stdio: "pipe" });
  } catch {
    console.error("ERREUR: la commande `sqlite3` n'est pas disponible dans PATH.");
    console.error("Installez-la via: brew install sqlite3");
    process.exit(1);
  }

  const results = {};

  try {
    results.Agency                = await migrateAgency();
    results.User                  = await migrateUser();
    results.Negotiator            = await migrateNegotiator();
    results.Ambassador            = await migrateAmbassador();
    results.Lead                  = await migrateLead();
    results.Contract              = await migrateContract();
    results.HonoraryAcknowledgment = await migrateHonoraryAcknowledgment();
  } catch (err) {
    console.error("\n✖ ERREUR lors de la migration :", err.message);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║             Résultat de la migration             ║");
  console.log("╠══════════════════════════════════════════════════╣");
  for (const [table, count] of Object.entries(results)) {
    const label = table.padEnd(26);
    const val = String(count).padStart(4);
    console.log(`║  ${label} : ${val} ligne(s)              ║`);
  }
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("\n✔ Migration terminée avec succès !\n");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Erreur fatale :", err);
  await prisma.$disconnect();
  process.exit(1);
});
