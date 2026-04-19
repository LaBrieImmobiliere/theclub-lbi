import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail, sendNewAmbassadorEmail, sendNotificationEmail } from "@/lib/email";
import { auditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitize } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  // Rate limit: 5 inscription attempts per IP per 15 minutes
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed } = checkRateLimit(`inscription:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    await auditLog("RATE_LIMITED", "Inscription", null, null, `Inscription rate limited for IP: ${ip}`);
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const {
    name, firstName, lastName, email, phone, password,
    referralCode, selectedAgencyId, selectedNegotiatorId,
    address, postalCode, city,
    // Statut juridique
    legalStatus,
    companyName, companyLegalForm, companySiret, companyTva, companyRcs, companyCapital, companyAddress,
    associationName, associationRna, associationObject,
  } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Nom, email et mot de passe requis" },
      { status: 400 }
    );
  }

  // Password policy: minimum 8 chars, 1 uppercase, 1 number
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(body.password)) {
    return NextResponse.json({
      error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre."
    }, { status: 400 });
  }

  // Check if email already used
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Cette adresse email est déjà utilisée. Connectez-vous à votre espace." },
      { status: 400 }
    );
  }

  // Determine agency and negotiator
  let negotiatorId: string | null = null;
  let agencyId: string | null = null;

  // Priority 1: referral code
  if (referralCode) {
    const negotiator = await prisma.negotiator.findUnique({
      where: { code: referralCode },
      include: { agency: true },
    });

    if (negotiator) {
      negotiatorId = negotiator.id;
      agencyId = negotiator.agencyId;
    } else {
      const ambassador = await prisma.ambassador.findUnique({
        where: { code: referralCode },
      });
      if (ambassador) {
        agencyId = ambassador.agencyId;
        negotiatorId = ambassador.negotiatorId;
      }
    }
  }

  // Priority 2: selected agency/negotiator from form
  if (!agencyId && selectedAgencyId) {
    agencyId = selectedAgencyId;
  }
  if (!negotiatorId && selectedNegotiatorId) {
    negotiatorId = selectedNegotiatorId;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const code = generateCode("AMB");

  // Sanitize user inputs
  const safeName = sanitize(name);
  const safeFirstName = firstName ? sanitize(firstName) : null;
  const safeLastName = lastName ? sanitize(lastName) : null;
  const safeEmail = email.trim().toLowerCase();
  const safePhone = phone ? sanitize(phone) : null;

  const user = await prisma.user.create({
    data: {
      name: safeName,
      firstName: safeFirstName,
      lastName: safeLastName,
      email: safeEmail,
      phone: safePhone,
      address: address || null,
      postalCode: postalCode || null,
      city: city || null,
      password: hashedPassword,
      role: "AMBASSADOR",
      ambassador: {
        create: {
          code,
          agencyId,
          negotiatorId,
          legalStatus: legalStatus || "PARTICULIER",
          companyName: companyName || null,
          companyLegalForm: companyLegalForm || null,
          companySiret: companySiret || null,
          companyTva: companyTva || null,
          companyRcs: companyRcs || null,
          companyCapital: companyCapital || null,
          companyAddress: companyAddress || null,
          associationName: associationName || null,
          associationRna: associationRna || null,
          associationObject: associationObject || null,
        },
      },
    },
    include: {
      ambassador: {
        include: { agency: true, negotiator: { include: { user: true } } },
      },
    },
  });

  // Find negotiator info for welcome email
  let negotiatorInfo = undefined;
  if (negotiatorId) {
    const neg = await prisma.negotiator.findUnique({
      where: { id: negotiatorId },
      include: { user: true, agency: true },
    });
    if (neg) {
      negotiatorInfo = {
        name: neg.user.name ?? "Négociateur",
        email: neg.user.email,
        phone: neg.user.phone,
        agencyName: neg.agency.name,
        photo: neg.user.image,
      };
    }
  }

  // Send welcome email with negotiator info
  await sendWelcomeEmail(email, name, password, "AMBASSADOR", negotiatorInfo);

  // Auto-generate apporteur d'affaire contract for signature
  if (user.ambassador) {
    try {
      const contractNumber = `CAA-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
      await prisma.contract.create({
        data: {
          ambassadorId: user.ambassador.id,
          number: contractNumber,
          commissionType: "PERCENTAGE",
          commissionValue: 5,
          // ENVOYE dès l'inscription : c'est un contrat cadre d'apporteur d'affaire,
          // prêt à signer immédiatement par l'ambassadeur (pas de paramétrage admin requis).
          status: "ENVOYE",
          notes: "Contrat d'apporteur d'affaire généré automatiquement à l'inscription. En attente de signature.",
        },
      });

      // Notify ambassador to sign the contract
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Contrat à signer ✍️",
          message: "Votre contrat d'apporteur d'affaire est prêt. Signez-le pour activer votre compte ambassadeur.",
          type: "WARNING",
          link: "/portail/mes-contrats",
        },
      });
    } catch (e) {
      console.error("[inscription] Failed to create auto contract:", e);
      // Don't block inscription if contract creation fails
    }
  }

  // Notify the negotiator who recruited this ambassador
  if (negotiatorId) {
    const neg = await prisma.negotiator.findUnique({
      where: { id: negotiatorId },
      include: { user: true },
    });
    if (neg) {
      await prisma.notification.create({
        data: {
          userId: neg.userId,
          title: "Nouvel ambassadeur recruté",
          message: `${name} vient de s'inscrire comme ambassadeur via votre lien de parrainage.`,
          type: "SUCCESS",
        },
      });

      // Send email to negotiator
      const agencyName = user.ambassador?.agency?.name || "La Brie Immobilière";
      await sendNewAmbassadorEmail(
        neg.user.email,
        neg.user.name ?? "Négociateur",
        name,
        email,
        phone || null,
        agencyName
      );
    }
  }

  // Alerte rouge pour les admins si l'ambassadeur s'est inscrit sans agence
  // et/ou sans conseiller (cas typique d'une inscription libre sans code de
  // parrainage). Une attribution manuelle est nécessaire.
  if (user.ambassador && (!agencyId || !negotiatorId)) {
    const missing: string[] = [];
    if (!agencyId) missing.push("agence");
    if (!negotiatorId) missing.push("conseiller");
    const missingText = missing.join(" et ");

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true },
    });

    const ambLink = `/admin/ambassadeurs/${user.ambassador.id}`;
    const notifTitle = "Ambassadeur à attribuer";
    const notifMessage = `${name} s'est inscrit sans ${missingText}. Une attribution est nécessaire.`;
    const emailSubject = "Action requise - Ambassadeur à attribuer";
    const emailBody =
      `${name} (${email}) vient de s'inscrire comme ambassadeur sans ${missingText}.\n\n` +
      `Merci de procéder à l'attribution depuis la fiche ambassadeur sur la plateforme.`;

    await Promise.all(
      admins.map(async (admin) => {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: notifTitle,
            message: notifMessage,
            type: "ERROR",
            link: ambLink,
          },
        });
        try {
          await sendNotificationEmail(
            admin.email,
            admin.name ?? "Administrateur",
            emailSubject,
            emailBody,
          );
        } catch (e) {
          console.error("[inscription] Failed to send admin alert email:", e);
        }
      }),
    );
  }

  await auditLog("CREATE", "Ambassador", user.ambassador?.id, null, `Inscription ambassadeur ${name} (${email})`);

  return NextResponse.json(
    {
      success: true,
      ambassadorCode: user.ambassador?.code,
      message: "Compte ambassadeur créé avec succès",
    },
    { status: 201 }
  );
}
