import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "pro1.mail.ovh.net",
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER || "",
    pass: process.env.EMAIL_SERVER_PASSWORD || "",
  },
});

const fromAddress = `"The Club - La Brie Immobilière" <${process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER}>`;

/** Strip HTML tags to generate text/plain version (fixes MIME_HTML_ONLY spam flag) */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface NegotiatorInfo {
  name: string;
  email: string;
  phone?: string | null;
  agencyName: string;
  photo?: string | null;
}

export async function sendWelcomeEmail(to: string, name: string, password: string, role: string, negotiator?: NegotiatorInfo) {
  const { emailLayout } = await import("./email-template");
  const portalUrl = `${process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr"}`;
  const roleLabel = role === "NEGOTIATOR" ? "Négociateur" : "Ambassadeur";

  const negotiatorBlock = negotiator ? `
    <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
      <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Votre conseiller</p>
      <p style="margin:0;font-size:14px;color:#030A24;font-weight:bold;">${negotiator.name}</p>
      <p style="margin:3px 0 0;font-size:13px;color:#666;">${negotiator.agencyName}</p>
      ${negotiator.phone ? `<p style="margin:3px 0 0;font-size:13px;color:#666;">📞 ${negotiator.phone}</p>` : ""}
      <p style="margin:3px 0 0;font-size:13px;color:#666;">✉️ ${negotiator.email}</p>
    </div>
  ` : "";

  const html = emailLayout({
    preheader: `Bienvenue sur The Club ! Votre espace ${roleLabel.toLowerCase()} est prêt.`,
    title: `Bienvenue ${name} !`,
    greeting: `Félicitations ! Votre espace ${roleLabel.toLowerCase()} a été créé sur The Club — La Brie Immobilière.`,
    body: `
      <p style="margin:0 0 15px;">Vous faites désormais partie de notre réseau de partenaires privilégiés.</p>

      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Vos identifiants</p>
        <p style="margin:0;font-size:14px;color:#030A24;"><strong>Email :</strong> ${to}</p>
        <p style="margin:5px 0 0;font-size:14px;color:#030A24;"><strong>Mot de passe :</strong> ${password}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#999;font-style:italic;">Pensez à modifier votre mot de passe lors de votre première connexion.</p>
      </div>

      ${negotiatorBlock}

      <p style="margin:15px 0 0;font-size:13px;color:#666;">💡 <strong>Conseil :</strong> Recommandez vos proches ayant un projet immobilier et touchez 5% de commission sur chaque transaction aboutie !</p>
    `,
    cta: { label: "Accéder à mon espace", url: portalUrl },
    footer: "📱 Installez l'app sur votre téléphone : ouvrez le lien dans Safari (iPhone) ou Chrome (Android), puis « Ajouter à l'écran d'accueil ».",
  });

  // Legacy variables kept for compatibility
  const tips = [
    "Pensez à votre entourage.",
    "Le timing est clé.",
    "5% des honoraires par transaction.",
  ];

  void tips; // kept for backward compat
  // Legacy HTML removed — using emailLayout above

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Bienvenue sur The Club : La Brie Immobilière — Votre espace ${roleLabel}`,
      html,
      text: htmlToText(html),
    });
    console.log(`[email] Welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send welcome email:", error);
    return false;
  }
}

export async function sendNewLeadEmail(to: string, ambassadorName: string, leadName: string, leadType: string) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Nouvelle recommandation : ${leadName}`,
    title: "Nouvelle recommandation ! 🎉",
    greeting: `Bonjour,`,
    body: `
      <p style="margin:0 0 15px;">Un ambassadeur vient de soumettre une nouvelle recommandation.</p>
      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Recommandation</p>
        <p style="margin:0;font-size:15px;color:#030A24;font-weight:bold;">${leadName}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Type :</strong> ${leadType}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Ambassadeur :</strong> ${ambassadorName}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;">Notre équipe va contacter ${leadName} dans les 48 heures.</p>
    `,
    cta: { label: "Traiter la recommandation", url: `${appUrl}/admin/recommandations` },
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject: `Nouvelle recommandation : ${leadName} — The Club`, html, text: htmlToText(html) });
    return true;
  } catch (error) {
    console.error("[email] Failed to send new lead email:", error);
    return false;
  }
}


export async function sendNotificationEmail(to: string, name: string, subject: string, message: string) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: message.substring(0, 100),
    title: subject,
    greeting: `Bonjour ${name},`,
    body: `<div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:0 0 15px;"><p style="margin:0;font-size:14px;color:#030A24;line-height:1.7;">${message.replace(/\n/g, "<br/>")}</p></div>`,
    cta: { label: "Accéder à la plateforme", url: appUrl },
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject, html, text: htmlToText(html) });
    return true;
  } catch (error) {
    console.error("[email] Failed to send notification email:", error);
    return false;
  }
}


export async function sendRibReminderEmail(to: string, name: string, contractNumber: string) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Ajoutez votre RIB pour recevoir vos commissions`,
    title: "Contrat signé — ajoutez votre RIB",
    greeting: `Bonjour ${name},`,
    body: `
      <p style="margin:0 0 15px;font-size:14px;color:#030A24;line-height:1.7;">
        Votre contrat <strong>${contractNumber}</strong> a bien été signé. Merci !
      </p>
      <div style="background:#FEF3C7;border-left:3px solid #D97706;padding:15px 20px;margin:0 0 20px;">
        <p style="margin:0 0 5px;font-size:12px;color:#92400E;text-transform:uppercase;letter-spacing:1px;font-weight:600;">&#9888;&#65039; Action requise</p>
        <p style="margin:0;font-size:14px;color:#78350F;line-height:1.6;">
          Pour recevoir vos commissions, vous devez renseigner votre <strong>RIB (IBAN)</strong> dans votre espace personnel.
        </p>
      </div>
      <p style="margin:0 0 15px;font-size:13px;color:#666;line-height:1.6;">
        Sans RIB enregistré, nous ne pourrons pas procéder au versement de vos commissions.
        Cliquez sur le bouton ci-dessous pour l'ajouter en quelques secondes.
      </p>
    `,
    cta: { label: "Ajouter mon RIB", url: `${appUrl}/portail/profil` },
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject: `Contrat ${contractNumber} signé — Ajoutez votre RIB | The Club`, html, text: htmlToText(html) });
    console.log(`[email] RIB reminder sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send RIB reminder:", error);
    return false;
  }
}

export async function sendRibAddedNotification(ambassadorName: string, ambassadorEmail: string, iban: string) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";
  const maskedIban = iban.substring(0, 4) + " **** **** " + iban.substring(iban.length - 4);

  const html = emailLayout({
    preheader: `${ambassadorName} a renseigné son RIB`,
    title: "RIB ajouté par un ambassadeur",
    greeting: `Bonjour,`,
    body: `
      <p style="margin:0 0 15px;font-size:14px;color:#030A24;line-height:1.7;">
        Un ambassadeur vient de renseigner ses coordonnées bancaires.
      </p>
      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:0 0 20px;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Ambassadeur</p>
        <p style="margin:0;font-size:15px;color:#030A24;font-weight:bold;">${ambassadorName}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Email :</strong> ${ambassadorEmail}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>IBAN :</strong> ${maskedIban}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
        Vous pouvez consulter la fiche de cet ambassadeur pour vérifier les informations.
      </p>
    `,
    cta: { label: "Voir les ambassadeurs", url: `${appUrl}/admin/ambassadeurs` },
  });

  // Send to all admin users
  const { prisma } = await import("./prisma");
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });

  for (const admin of admins) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: admin.email,
        subject: `RIB ajouté : ${ambassadorName} — The Club`,
        html,
        text: htmlToText(html),
      });
    } catch (error) {
      console.error(`[email] Failed to send RIB notification to ${admin.email}:`, error);
    }
  }
  console.log(`[email] RIB added notification sent to ${admins.length} admin(s)`);
  return true;
}

export async function sendNegotiatorWelcomeEmail(
  to: string,
  name: string,
  password: string,
  code: string,
  agencyInfo: { name: string; address: string; city: string; postalCode?: string; phone?: string; email?: string }
) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Bienvenue ${name} ! Votre espace négociateur est prêt.`,
    title: `Bienvenue ${name} !`,
    greeting: `Félicitations ! Votre espace négociateur a été créé sur The Club — La Brie Immobilière.`,
    body: `
      <p style="margin:0 0 15px;">Vous intégrez le programme The Club en tant que négociateur rattaché à l'agence de <strong>${agencyInfo.name}</strong>.</p>

      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Vos identifiants</p>
        <p style="margin:0;font-size:14px;color:#030A24;"><strong>Email :</strong> ${to}</p>
        <p style="margin:5px 0 0;font-size:14px;color:#030A24;"><strong>Mot de passe :</strong> ${password}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#999;font-style:italic;">Pensez à modifier votre mot de passe.</p>
      </div>

      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Votre agence</p>
        <p style="margin:0;font-size:15px;color:#030A24;font-weight:bold;">${agencyInfo.name}</p>
        <p style="margin:3px 0 0;font-size:13px;color:#666;">${agencyInfo.address}, ${agencyInfo.city}</p>
        <p style="margin:3px 0 0;font-size:13px;color:#666;">Code recrutement : <strong>${code}</strong></p>
      </div>

      <p style="margin:15px 0 0;font-size:13px;color:#666;">🔗 Partagez votre code pour recruter des ambassadeurs.</p>
    `,
    cta: { label: "Accéder à mon espace", url: `${appUrl}/negociateur/tableau-de-bord` },
    footer: "📱 Installez l'app : Safari → Partager → Sur l'écran d'accueil",
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject: `Bienvenue ${name} — Négociateur | The Club`, html, text: htmlToText(html) });
    console.log(`[email] Negotiator welcome email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send negotiator welcome email:", error);
    return false;
  }
}

export async function sendContractEmail(
  to: string,
  name: string,
  contractNumber: string,
  pdfBuffer: Buffer
) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Votre contrat ${contractNumber} est prêt à signer`,
    title: "Votre contrat d'apporteur d'affaire ✍️",
    greeting: `Bonjour ${name},`,
    body: `
      <p style="margin:0 0 15px;font-size:14px;color:#030A24;line-height:1.7;">
        Votre contrat <strong>${contractNumber}</strong> a été signé par l'agence et vous est envoyé pour signature.
      </p>
      <div style="background:#FEF3C7;border-left:3px solid #D97706;padding:15px 20px;margin:0 0 20px;">
        <p style="margin:0;font-size:14px;color:#78350F;line-height:1.6;">
          ✍️ Connectez-vous à votre espace pour <strong>signer électroniquement</strong> le contrat.
        </p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
        Vous trouverez une copie du contrat en pièce jointe. La version complète des CGU est consultable dans votre espace personnel.
      </p>
    `,
    cta: { label: "Signer mon contrat", url: `${appUrl}/portail/mes-contrats` },
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Contrat ${contractNumber} à signer — The Club`,
      html,
      text: htmlToText(html),
      attachments: [
        {
          filename: `contrat-${contractNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    console.log(`[email] Contract PDF sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send contract email:", error);
    return false;
  }
}

export async function sendAcknowledgmentEmail(
  to: string,
  name: string,
  ackNumber: string,
  leadName: string,
  pdfBuffer: Buffer
) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Reconnaissance d'honoraires ${ackNumber} signée`,
    title: "Reconnaissance d'honoraires signée ✅",
    greeting: `Bonjour ${name},`,
    body: `
      <p style="margin:0 0 15px;font-size:14px;color:#030A24;line-height:1.7;">
        La reconnaissance d'honoraires <strong>${ackNumber}</strong> pour <strong>${leadName}</strong> a été signée par les deux parties.
      </p>
      <div style="background:#ECFDF5;border-left:3px solid #059669;padding:15px 20px;margin:0 0 20px;">
        <p style="margin:0;font-size:14px;color:#065F46;line-height:1.6;">
          ✅ Vous trouverez le document signé en pièce jointe de cet email.
        </p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
        Conservez ce document pour vos archives comptables.
      </p>
    `,
    cta: { label: "Voir mes contrats", url: `${appUrl}/portail/mes-contrats` },
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Reconnaissance d'honoraires ${ackNumber} signée — The Club`,
      html,
      text: htmlToText(html),
      attachments: [
        {
          filename: `reconnaissance-honoraires-${ackNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    console.log(`[email] Acknowledgment PDF sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send acknowledgment email:", error);
    return false;
  }
}

export async function sendNewAmbassadorEmail(
  to: string,
  negotiatorName: string,
  ambassadorName: string,
  ambassadorEmail: string,
  ambassadorPhone: string | null,
  agencyName: string
) {
  const { emailLayout } = await import("./email-template");
  const appUrl = process.env.NEXTAUTH_URL || "https://theclub.labrieimmobiliere.fr";

  const html = emailLayout({
    preheader: `Nouvel ambassadeur : ${ambassadorName}`,
    title: "Nouvel ambassadeur recruté ! 🎉",
    greeting: `Bonjour ${negotiatorName},`,
    body: `
      <p style="margin:0 0 15px;">Un nouvel ambassadeur vient de rejoindre votre réseau via votre lien de recrutement.</p>
      <div style="background:#f9f6f1;border-left:3px solid #D1B280;padding:15px 20px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Nouvel ambassadeur</p>
        <p style="margin:0;font-size:15px;color:#030A24;font-weight:bold;">${ambassadorName}</p>
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Email :</strong> ${ambassadorEmail}</p>
        ${ambassadorPhone ? `<p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Téléphone :</strong> ${ambassadorPhone}</p>` : ""}
        <p style="margin:5px 0 0;font-size:13px;color:#666;"><strong>Agence :</strong> ${agencyName}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#666;">Vous pouvez échanger avec votre nouvel ambassadeur depuis la messagerie.</p>
    `,
    cta: { label: "Voir mes ambassadeurs", url: `${appUrl}/negociateur/mes-ambassadeurs` },
  });

  try {
    await transporter.sendMail({ from: fromAddress, to, subject: `Nouvel ambassadeur recruté : ${ambassadorName} — The Club`, html, text: htmlToText(html) });
    console.log(`[email] New ambassador email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[email] Failed to send new ambassador email:", error);
    return false;
  }
}
