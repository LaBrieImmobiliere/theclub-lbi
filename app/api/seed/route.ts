import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateCode, generateContractNumber } from "@/lib/utils";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non disponible en production" }, { status: 403 });
  }

  try {
    // ── ADMIN ──
    const adminEmail = process.env.ADMIN_EMAIL || "contact@labrieimmobiliere.fr";
    const adminPassword = process.env.ADMIN_PASSWORD || "Alexandre94!@";

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          name: "Administrateur La Brie Immobilière",
          email: adminEmail,
          password: await bcrypt.hash(adminPassword, 10),
          role: "ADMIN",
        },
      });
    } else {
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          name: "Administrateur La Brie Immobilière",
          password: await bcrypt.hash(adminPassword, 10),
        },
      });
    }

    // ── AGENCES ──
    const agencies = [
      {
        name: "Villecresnes N19",
        code: "VILLECRESNES-N19",
        address: "41, avenue du Maréchal de Lattre de Tassigny",
        postalCode: "94440",
        city: "VILLECRESNES",
        phone: "01 45 99 11 37",
        email: "villecresnes@labrieimmobiliere.fr",
      },
      {
        name: "Villecresnes Centre Ville",
        code: "VILLECRESNES-CV",
        address: "1, rue de Cerçay",
        postalCode: "94440",
        city: "VILLECRESNES",
        phone: "01 56 73 18 14",
        email: "villecresnes@labrieimmobiliere.fr",
      },
      {
        name: "Brie Comte Robert",
        code: "BRIE-CR",
        address: "19, rue du Général Leclerc",
        postalCode: "77170",
        city: "BRIE COMTE ROBERT",
        phone: "01 64 05 53 23",
        email: "briecomterobert@labrieimmobiliere.fr",
      },
      {
        name: "Marolles en Brie",
        code: "MAROLLES",
        address: "11, rue des Marchands",
        postalCode: "94440",
        city: "MAROLLES EN BRIE",
        phone: null,
        email: "marollesenbrie@labrieimmobiliere.fr",
      },
    ];

    const agencyRecords = [];
    for (const ag of agencies) {
      const existing = await prisma.agency.findUnique({ where: { code: ag.code } });
      if (!existing) {
        agencyRecords.push(await prisma.agency.create({ data: ag }));
      } else {
        agencyRecords.push(await prisma.agency.update({ where: { code: ag.code }, data: ag }));
      }
    }

    // ── AMBASSADEURS DE DEMO ──
    const ambassadors = [
      // Villecresnes N19
      { name: "Sophie Martin", email: "sophie.martin@example.com", phone: "06 12 34 56 78", agencyIdx: 0 },
      { name: "Pierre Durand", email: "pierre.durand@example.com", phone: "06 23 45 67 89", agencyIdx: 0 },
      // Villecresnes Centre Ville
      { name: "Julie Bernard", email: "julie.bernard@example.com", phone: "06 34 56 78 90", agencyIdx: 1 },
      { name: "Thomas Moreau", email: "thomas.moreau@example.com", phone: "06 45 67 89 01", agencyIdx: 1 },
      // Brie Comte Robert
      { name: "Camille Petit", email: "camille.petit@example.com", phone: "06 56 78 90 12", agencyIdx: 2 },
      { name: "Nicolas Roux", email: "nicolas.roux@example.com", phone: "06 67 89 01 23", agencyIdx: 2 },
      // Marolles en Brie
      { name: "Emma Leroy", email: "emma.leroy@example.com", phone: "06 78 90 12 34", agencyIdx: 3 },
      { name: "Lucas Garcia", email: "lucas.garcia@example.com", phone: "06 89 01 23 45", agencyIdx: 3 },
    ];

    for (const amb of ambassadors) {
      const existing = await prisma.user.findUnique({ where: { email: amb.email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            name: amb.name,
            email: amb.email,
            phone: amb.phone,
            password: await bcrypt.hash("demo123", 10),
            role: "AMBASSADOR",
            ambassador: {
              create: {
                code: generateCode("AMB"),
                status: "ACTIVE",
                agencyId: agencyRecords[amb.agencyIdx].id,
              },
            },
          },
        });
      } else {
        // Update agency assignment if ambassador exists
        const ambRecord = await prisma.ambassador.findUnique({ where: { userId: existing.id } });
        if (ambRecord) {
          await prisma.ambassador.update({
            where: { id: ambRecord.id },
            data: { agencyId: agencyRecords[amb.agencyIdx].id },
          });
        }
      }
    }

    // ── LEADS DE DEMO ──
    const firstAmb = await prisma.ambassador.findFirst({
      include: { user: true },
    });

    if (firstAmb) {
      const leadCount = await prisma.lead.count({ where: { ambassadorId: firstAmb.id } });
      if (leadCount === 0) {
        const lead1 = await prisma.lead.create({
          data: {
            ambassadorId: firstAmb.id,
            agencyId: firstAmb.agencyId,
            firstName: "Marc",
            lastName: "Lebrun",
            phone: "06 55 44 33 22",
            email: "marc.lebrun@example.com",
            type: "ACHAT",
            description: "Cherche un appartement 3 pièces à Villecresnes",
            budget: "320 000 €",
            location: "Villecresnes",
            status: "SIGNE",
          },
        });

        await prisma.contract.create({
          data: {
            number: generateContractNumber(),
            ambassadorId: firstAmb.id,
            leadId: lead1.id,
            commissionType: "PERCENTAGE",
            commissionValue: 5,
            propertyAddress: "15 rue des Lilas, 94440 Villecresnes",
            propertyPrice: 310000,
            honoraires: 9300,
            commissionAmount: 465,
            status: "SIGNE",
            signedAt: new Date(),
          },
        });

        await prisma.lead.create({
          data: {
            ambassadorId: firstAmb.id,
            agencyId: firstAmb.agencyId,
            firstName: "Claire",
            lastName: "Petit",
            phone: "06 66 77 88 99",
            type: "VENTE",
            description: "Veut vendre sa maison à Brie Comte Robert",
            location: "Brie Comte Robert",
            status: "EN_COURS",
          },
        });

        await prisma.lead.create({
          data: {
            ambassadorId: firstAmb.id,
            agencyId: firstAmb.agencyId,
            firstName: "Antoine",
            lastName: "Dubois",
            phone: "06 11 22 33 44",
            email: "a.dubois@example.com",
            type: "LOCATION",
            description: "Recherche location T2 proche gare",
            budget: "900 €/mois",
            location: "Marolles en Brie",
            status: "NOUVEAU",
          },
        });
      }
    }

    // Add leads for other ambassadors
    const allAmbs = await prisma.ambassador.findMany({ include: { user: true, leads: true } });
    for (const amb of allAmbs) {
      if (amb.leads.length === 0 && amb.id !== firstAmb?.id) {
        await prisma.lead.create({
          data: {
            ambassadorId: amb.id,
            agencyId: amb.agencyId,
            firstName: ["Jean", "Marie", "Paul", "Anne", "Luc", "Sarah", "David"][Math.floor(Math.random() * 7)],
            lastName: ["Martin", "Bernard", "Thomas", "Robert", "Richard", "Petit", "Moreau"][Math.floor(Math.random() * 7)],
            phone: `06 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
            type: ["ACHAT", "VENTE", "LOCATION", "INVESTISSEMENT"][Math.floor(Math.random() * 4)],
            description: "Projet immobilier en cours",
            location: ["Villecresnes", "Brie Comte Robert", "Marolles en Brie", "Sucy-en-Brie"][Math.floor(Math.random() * 4)],
            status: ["NOUVEAU", "EN_COURS", "CONTACTE"][Math.floor(Math.random() * 3)],
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Données de démonstration créées",
      agencies: agencyRecords.length,
      ambassadors: ambassadors.length,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Erreur lors du seed", details: String(error) }, { status: 500 });
  }
}
