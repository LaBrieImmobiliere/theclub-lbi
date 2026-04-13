import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail, sendNewAmbassadorEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
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

  const user = await prisma.user.create({
    data: {
      name,
      firstName: firstName || null,
      lastName: lastName || null,
      email,
      phone: phone || null,
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

  // Send welcome email with negotiator info and ambassador code
  const ambCode = user.ambassador?.code || code;
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
          status: "BROUILLON",
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

  return NextResponse.json(
    {
      success: true,
      ambassadorCode: user.ambassador?.code,
      message: "Compte ambassadeur créé avec succès",
    },
    { status: 201 }
  );
}
