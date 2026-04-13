/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import { agency } from "./agency-config";

function fmt(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)
    .replace(/\u00A0/g, " ").replace(/\u202F/g, " ");
}

function fmtDate(date: string | Date | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(date));
}

// ─── Helper: multi-page text writer ────────────────────────────────
function writeBlock(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH: number, pageMargin: number): number {
  const lines = doc.splitTextToSize(text, maxW);
  for (const line of lines) {
    if (y > 270) {
      addFooter(doc, pageMargin);
      doc.addPage();
      y = pageMargin;
    }
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

function addFooter(doc: jsPDF, margin: number) {
  const pageW = 210;
  const footerY = 287;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${agency.name} - ${agency.address}, ${agency.postalCode} ${agency.city}`, margin, footerY);
  doc.text(`SIRET ${agency.siret} - RCS ${agency.rcs} ${agency.rcsNumber}`, margin, footerY + 3);
  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.text(`Page ${pageNum}`, pageW - margin, footerY, { align: "right" });
}

// ─── CONTRACT PDF (CGU Ambassadeur style WIMMOV) ──────────────────
export function generateContractPDF(contract: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const M = 20; // margin
  const W = pageW - M * 2;
  let y = M;

  const ambassadorName = contract.ambassador?.user?.name || "_______________";
  const ambassadorEmail = contract.ambassador?.user?.email || "";
  const ambassadorPhone = contract.ambassador?.user?.phone || "";

  // ── HEADER ──
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(agency.name, M, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${agency.address}, ${agency.postalCode} ${agency.city}`, M, 21);
  doc.text(`N\u00B0 ${contract.number}`, pageW - M, 14, { align: "right" });
  doc.text(fmtDate(contract.createdAt), pageW - M, 21, { align: "right" });

  y = 40;

  // ── TITLE ──
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("CONDITIONS GENERALES D'UTILISATION DES SERVICES", pageW / 2, y, { align: "center" });
  y += 6;
  doc.text(`${agency.name}`, pageW / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.text("A DESTINATION DES PARRAINS APPORTEURS D'AFFAIRES", pageW / 2, y, { align: "center" });
  y += 12;

  // ── ENTRE ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ENTRE :", M, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  y = writeBlock(doc,
    `La soci\u00E9t\u00E9 ${agency.legalName}, ${agency.legalForm} au capital de ${agency.capital} \u20AC, ` +
    `soci\u00E9t\u00E9 \u00E9tablie et existante en vertu des lois fran\u00E7aises, inscrite au RCS de ${agency.rcs} ` +
    `sous le num\u00E9ro ${agency.rcsNumber} dont le si\u00E8ge social est situ\u00E9 ${agency.address} ${agency.postalCode} ${agency.city}.`,
    M, y, W, 4.5, M);
  y += 3;

  doc.setFont("helvetica", "italic");
  doc.text(`Ci-apr\u00E8s d\u00E9nomm\u00E9e \u00AB ${agency.name} \u00BB`, pageW - M, y, { align: "right" });
  doc.text("D'une part", pageW - M, y + 5, { align: "right" });
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("ET", M, y);
  y += 7;

  const ambLegalStatus = contract.ambassador?.legalStatus || "PARTICULIER";

  doc.setFont("helvetica", "normal");
  if (ambLegalStatus === "SOCIETE" && contract.ambassador?.companyName) {
    const amb = contract.ambassador;
    const companyLine = `La soci\u00E9t\u00E9 ${amb.companyName}` +
      (amb.companyLegalForm ? `, ${amb.companyLegalForm}` : "") +
      (amb.companyCapital ? ` au capital de ${amb.companyCapital}` : "") +
      (amb.companySiret ? `, SIRET ${amb.companySiret}` : "") +
      (amb.companyTva ? `, TVA ${amb.companyTva}` : "") +
      (amb.companyRcs ? `, RCS ${amb.companyRcs}` : "") +
      (amb.companyAddress ? `, dont le si\u00E8ge social est situ\u00E9 ${amb.companyAddress}` : "") +
      `.`;
    y = writeBlock(doc, companyLine, M, y, W, 4.5, M);
    y += 2;
    doc.text(`Repr\u00E9sent\u00E9e par ${ambassadorName}`, M, y);
    y += 5;
  } else if (ambLegalStatus === "ASSOCIATION" && contract.ambassador?.associationName) {
    const amb = contract.ambassador;
    const assoLine = `L'association ${amb.associationName}` +
      (amb.associationRna ? `, RNA ${amb.associationRna}` : "") +
      (amb.associationObject ? `, ayant pour objet : ${amb.associationObject}` : "") +
      `.`;
    y = writeBlock(doc, assoLine, M, y, W, 4.5, M);
    y += 2;
    doc.text(`Repr\u00E9sent\u00E9e par ${ambassadorName}`, M, y);
    y += 5;
  } else {
    doc.text(`Nom : ${ambassadorName}`, M, y);
    y += 5;
  }
  if (ambassadorEmail) { doc.text(`Email : ${ambassadorEmail}`, M, y); y += 5; }
  if (ambassadorPhone) { doc.text(`T\u00E9l\u00E9phone : ${ambassadorPhone}`, M, y); y += 5; }
  y += 3;

  doc.setFont("helvetica", "italic");
  doc.text("Ci-dessous d\u00E9nomm\u00E9(e) le \u00AB PARRAIN \u00BB", pageW - M, y, { align: "right" });
  doc.text("D'autre part", pageW - M, y + 5, { align: "right" });
  y += 15;

  // ── Section helper ──
  const sectionTitle = (num: string, title: string) => {
    if (y > 255) { addFooter(doc, M); doc.addPage(); y = M; }
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(M, y, W, 7, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(`ARTICLE ${num} : ${title}`, M + 3, y + 5);
    y += 12;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  };

  const para = (text: string, indent = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    y = writeBlock(doc, text, M + indent, y, W - indent, 4.5, M);
    y += 2;
  };

  const subTitle = (text: string) => {
    if (y > 265) { addFooter(doc, M); doc.addPage(); y = M; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(text, M, y);
    y += 6;
  };

  // ── ARTICLE 1 : DISPOSITIONS GENERALES ──
  sectionTitle("1", "DISPOSITIONS GENERALES - DISPOSITIF DE PARRAINAGE");

  para(
    `1.1 - La soci\u00E9t\u00E9 ${agency.name} d\u00E9veloppe et exploite un dispositif de parrainage ` +
    `d'apports d'affaires \u00E0 destination des particuliers accessible depuis l'application ` +
    `d\u00E9di\u00E9e et le site ${agency.website}.`
  );

  para(
    `1.2 - Le dispositif de parrainage ${agency.name} permet ainsi \u00E0 des apporteurs d'affaires ` +
    `(ci-apr\u00E8s le ou les \u00AB PARRAINS \u00BB) d'effectuer des op\u00E9rations d'interm\u00E9diation d'affaires ` +
    `avec des professionnels (les \u00AB PARTENAIRES \u00BB) et de communiquer les coordonn\u00E9es de personnes ` +
    `(ci-apr\u00E8s le \u00AB FILLEUL \u00BB) qu'ils savent int\u00E9ress\u00E9es par la r\u00E9alisation d'une ou plusieurs op\u00E9rations juridiques.`
  );

  para(
    `1.3 - Les r\u00E8gles d'\u00E9ligibilit\u00E9 des PARRAINS et FILLEULS telles que d\u00E9finies ci-apr\u00E8s pourront faire ` +
    `l'objet de modifications, de suppressions, d'ajouts dans le respect des proc\u00E9dures et ` +
    `dispositions l\u00E9gales applicables.`
  );

  para(
    `1.4 - Les pr\u00E9sentes conditions g\u00E9n\u00E9rales d'utilisation doivent \u00EAtre accept\u00E9es par les PARRAINS ` +
    `et restent accessibles sur l'application ${agency.name} notamment depuis l'espace personnel de chaque PARRAIN.`
  );

  // ── ARTICLE 2 : CONDITIONS D'ELIGIBILITE ──
  sectionTitle("2", "CONDITIONS D'ELIGIBILITE DES PARRAINS");

  subTitle("2.1 - LE PARRAINAGE D'UNE OPERATION IMMOBILIERE (vente, achat ou gestion locative)");

  para(
    `2.1.1 - Le parrainage occasionnel est ouvert \u00E0 toute personne physique majeure capable ` +
    `juridiquement qui envisage de mani\u00E8re occasionnelle de participer \u00E0 titre d'interm\u00E9diaire ` +
    `dans une op\u00E9ration immobili\u00E8re (vente, achat ou gestion locative).`
  );

  para(
    `2.1.2 - En adh\u00E9rant aux pr\u00E9sentes conditions g\u00E9n\u00E9rales d'utilisation, le PARRAIN OCCASIONNEL d\u00E9clare :`
  );

  const bullets21 = [
    "ne pas se livrer ou pr\u00EAter son concours, m\u00EAme accessoire, de mani\u00E8re habituelle \u00E0 des op\u00E9rations d'interm\u00E9diation portant sur des biens immobiliers ;",
    "ne pas avoir particip\u00E9, directement ou indirectement, \u00E0 une op\u00E9ration d'interm\u00E9diation immobili\u00E8re dans l'ann\u00E9e qui pr\u00E9c\u00E8de sa participation aux services d'interm\u00E9diation de la plateforme ;",
    `ne pas parrainer plusieurs filleuls ou biens immobiliers par an depuis son premier parrainage sur la plateforme ${agency.name}.`,
  ];
  bullets21.forEach(b => {
    para(`\u2022 ${b}`, 4);
  });

  // ── ARTICLE 3 : GARANTIE DONNEES PAR LES PARRAINS ──
  sectionTitle("3", "GARANTIE DONNEES PAR LES PARRAINS");

  para(
    `3.1 - Compte tenu des conditions de participation au parrainage strictement d\u00E9limit\u00E9es et ` +
    `\u00E9nonc\u00E9es aux articles 2.1 \u00E0 2.3 des pr\u00E9sentes, les PARRAINS s'engagent \u00E0 garantir la soci\u00E9t\u00E9 ` +
    `${agency.name} et les PARTENAIRES des cons\u00E9quences de toute nature, notamment sociales et fiscales, ` +
    `qui pourraient r\u00E9sulter d'une participation irr\u00E9guli\u00E8re de leur part aux services de parrainage ` +
    `accessibles sur la plateforme ${agency.name} et/ou d'une utilisation non conforme des services propos\u00E9s.`
  );

  // ── ARTICLE 4 : CONDITIONS D'ELIGIBILITE DU FILLEUL ──
  sectionTitle("4", "CONDITIONS D'ELIGIBILITE DU FILLEUL");

  para(
    `4.1 - Le FILLEUL est une personne physique majeure capable juridiquement qui souhaite ` +
    `r\u00E9aliser une op\u00E9ration juridique via un PARTENAIRE de ${agency.name}.`
  );

  para(
    `4.2 - Le FILLEUL ne doit pas se livrer ou pr\u00EAter son concours, m\u00EAme accessoire, de mani\u00E8re ` +
    `habituelle \u00E0 des op\u00E9rations portant sur des biens immobiliers et en cons\u00E9quence ne doit pas ` +
    `se trouver en infraction avec la r\u00E9glementation contraignante mise en place par la Loi n\u00B0 70-9 ` +
    `du 2 janvier 1970 r\u00E9glementant les conditions d'exercice des activit\u00E9s relatives \u00E0 certaines ` +
    `op\u00E9rations portant sur les immeubles et les fonds de commerce et ses modifications l\u00E9gislatives ult\u00E9rieures.`
  );

  // ── ARTICLE 5 : INDEPENDANCE DES PARTIES ──
  sectionTitle("5", "INDEPENDANCE DES PARTIES");

  para(
    `5.1 - Les PARRAINS et la soci\u00E9t\u00E9 ${agency.name} d\u00E9clarent qu'ils restent totalement libres l'un ` +
    `\u00E0 l'\u00E9gard de l'autre et que le rapport juridique n\u00E9 de la pr\u00E9sente convention est exclu de toute ` +
    `relation de subordination juridique.`
  );

  para(
    `5.2 - ${agency.name} n'intervient pas dans la relation entre LES PARRAINS et les PARTENAIRES ` +
    `ni dans les relations entre les FILLEULS et les PARTENAIRES ou dans les relations entre les PARRAINS et les FILLEULS.`
  );

  // ── ARTICLE 6 : MODALITES DE PARTICIPATION ──
  sectionTitle("6", "MODALITES DE PARTICIPATION");

  para(
    `6.1 - Le dispositif de parrainage ${agency.name} consiste pour les PARRAINS \u00E0 communiquer \u00E0 une des ` +
    `agences PARTENAIRES de ${agency.name} les coordonn\u00E9es d'une personne physique majeure qu'ils savent ` +
    `int\u00E9ress\u00E9e par une op\u00E9ration juridique sp\u00E9cifique (notamment vente/achat d'un bien immobilier, ` +
    `gestion locative, courtage ou autre).`
  );

  para(
    `6.2 - A cette fin, les PARRAINS devront compl\u00E9ter le formulaire de parrainage accessible depuis ` +
    `leur espace personnel sur l'application ${agency.name}.`
  );

  para(
    `6.3 - Seuls les formulaires ${agency.name} conformes et int\u00E9gralement compl\u00E9t\u00E9s seront retenus.`
  );

  para(
    `6.4 - Un email de confirmation faisant foi de la date d'enregistrement du parrainage sera alors ` +
    `adress\u00E9 au PARRAIN par ${agency.name}.`
  );

  para(
    `6.5 - Apr\u00E8s r\u00E9gularisation du formulaire de parrainage, le PARTENAIRE aupr\u00E8s duquel le PARRAIN ` +
    `sera rattach\u00E9 pour une op\u00E9ration juridique d\u00E9termin\u00E9e et un FILLEUL d\u00E9termin\u00E9, prendra contact ` +
    `avec le FILLEUL afin de v\u00E9rifier la validit\u00E9 du parrainage et le consentement du FILLEUL.`
  );

  para(
    `6.6 - L'auto-parrainage et le parrainage entre coacqu\u00E9reurs sont interdits \u00E9tant pr\u00E9cis\u00E9 qu'en ` +
    `pr\u00E9sence d'un parrainage multiple (coordonn\u00E9es communiqu\u00E9es par plusieurs PARRAINS), ` +
    `seul le premier parrainage enregistr\u00E9 sur la plateforme ${agency.name} sera retenu.`
  );

  para("6.7 - Le parrainage ne peut pas \u00EAtre r\u00E9troactif.");

  // ── ARTICLE 7 : GARANTIE DE L'ACCORD DU FILLEUL ──
  sectionTitle("7", "GARANTIE DE L'ACCORD DU FILLEUL");

  para(
    `7.1 - Les PARRAINS d\u00E9clarent avoir obtenu l'autorisation \u00E9crite et pr\u00E9alable du FILLEUL, de ` +
    `communiquer ses coordonn\u00E9es \u00E0 l'un des PARTENAIRES de ${agency.name} dans le cadre de son projet ` +
    `et d\u00E9gage la soci\u00E9t\u00E9 ${agency.name} de toute responsabilit\u00E9 \u00E0 ce titre.`
  );

  // ── ARTICLE 8 : REALISATION EFFECTIVE ──
  sectionTitle("8", "REALISATION EFFECTIVE DE L'OPERATION JURIDIQUE PARRAINEE");

  para(
    `8.1 - Un parrainage ne donne lieu \u00E0 r\u00E9tribution du PARRAIN que dans l'hypoth\u00E8se de la ` +
    `r\u00E9alisation effective entre le PARTENAIRE et le FILLEUL de l'op\u00E9ration juridique parrain\u00E9e, \u00E0 savoir :`
  );

  const realisation = [
    "Pour une vente/achat d'un bien immobilier : la signature de l'acte authentique ;",
    "Pour une op\u00E9ration de gestion locative : la signature effective du bail ;",
    "Pour les autres op\u00E9rations parrain\u00E9es : la signature du contrat.",
  ];
  realisation.forEach(r => para(`\u2022 ${r}`, 4));

  // ── ARTICLE 9 : RETRIBUTION DES PARRAINS ──
  sectionTitle("9", "RETRIBUTION DES PARRAINS - COMMISSION");

  para(
    `9.1 - Le montant de la commission attribu\u00E9e aux PARRAINS en cas de r\u00E9alisation effective par le FILLEUL de ` +
    `l'op\u00E9ration juridique parrain\u00E9e, correspond \u00E0 ${agency.commission.value}% des honoraires HT ` +
    `hors charges sociales per\u00E7us par le PARTENAIRE ayant r\u00E9alis\u00E9 l'op\u00E9ration.`
  );

  para(
    `9.2 - Le pourcentage \u00E0 revenir aux PARRAINS mentionn\u00E9 \u00E0 l'article 9.1 des pr\u00E9sentes sera ` +
    `arr\u00EAt\u00E9 par les PARTENAIRES et fera l'objet d'une information \u00E9crite sp\u00E9cifique des ` +
    `PARTENAIRES transmise sur l'application ${agency.name} des PARRAINS d\u00E8s sa fixation.`
  );

  para(
    "9.3 - Les PARTENAIRES transmettront aux PARRAINS le montant du pourcentage \u00E0 revenir " +
    "leur revenant conform\u00E9ment aux articles 9.1 et 9.2 des pr\u00E9sentes \u00E0 un stade diff\u00E9rent selon " +
    "l'op\u00E9ration juridique parrain\u00E9e :"
  );

  const stades = [
    "Pour une vente/achat d'un bien immobilier : au stade du compromis ;",
    "Pour une op\u00E9ration de gestion locative : au stade de la signature du mandat ;",
    "Pour toutes les autres op\u00E9rations : au stade de l'\u00E9dition des offres.",
  ];
  stades.forEach(s => para(`\u2022 ${s}`, 4));

  para(
    `9.4 - Dans le mois qui suit la r\u00E9alisation de l'op\u00E9ration juridique parrain\u00E9e telle que d\u00E9finie \u00E0 ` +
    `l'article 8.1 des pr\u00E9sentes, le PARRAIN est tenu inform\u00E9 par le PARTENAIRE en charge du bien ` +
    `et re\u00E7oit un r\u00E8glement (${agency.payment.methods}) du montant de sa commission dans un ` +
    `d\u00E9lai de ${agency.payment.delay}.`
  );

  // ── ARTICLE 10 : FACTURATION ──
  sectionTitle("10", "FACTURATION");

  para(
    `10.1 - Lors de la r\u00E9alisation de l'op\u00E9ration juridique parrain\u00E9e et pour la perception de la ` +
    `r\u00E9tribution vis\u00E9e \u00E0 l'article 9 des pr\u00E9sentes, les PARRAINS \u00E9tabliront une facture d'honoraires ` +
    `\u00E0 l'attention du PARTENAIRE avec le mod\u00E8le mis \u00E0 leur disposition dans leur espace personnel ` +
    `de l'application ${agency.name}.`
  );

  para(
    `10.2 - ${agency.name} met \u00E0 la disposition des PARRAINS dans leur espace personnel un outil ` +
    `informatique permettant de g\u00E9n\u00E9rer automatiquement une facture d'honoraires nominative ` +
    `et comprenant l'ensemble des mentions l\u00E9gales obligatoires qui sera ensuite transmise au ` +
    `PARTENAIRE \u00E0 titre de justificatif comptable des sommes vers\u00E9es.`
  );

  // ── ARTICLE 11 : DECLARATION FISCALE ──
  sectionTitle("11", "DECLARATION FISCALE OBLIGATOIRE DES PARRAINS");

  para(
    `11.1 - Les sommes per\u00E7ues par les PARRAINS dans le cadre des parrainages r\u00E9alis\u00E9s sur la plateforme ` +
    `${agency.name} en application des dispositions de l'article 9 des pr\u00E9sentes conditions g\u00E9n\u00E9rales ` +
    `d'utilisation sont assujetties \u00E0 l'imp\u00F4t sur les revenus au titre de l'ann\u00E9e de leur encaissement.`
  );

  para(
    `11.2 - La soci\u00E9t\u00E9 ${agency.name} rappelle qu'il rel\u00E8ve de l'enti\u00E8re et unique responsabilit\u00E9 des ` +
    `PARRAINS de d\u00E9clarer cette somme aupr\u00E8s du service des imp\u00F4ts dont il rel\u00E8ve en ` +
    `communiquant \u00E0 cet effet \u00E0 ce service la facture d'honoraires g\u00E9n\u00E9r\u00E9e dans le cadre du ` +
    `pr\u00E9sent contrat ou le re\u00E7u pour don.`
  );

  // ── ARTICLE 12 : DONNEES PERSONNELLES ──
  sectionTitle("12", "DONNEES PERSONNELLES");

  para(
    `12.1 - La politique de collecte et de traitement des donn\u00E9es personnelles communiqu\u00E9es par ` +
    `les PARRAINS et les FILLEULS est accessible sur l'application ${agency.name}.`
  );

  para(
    `12.2 - Les collectes et traitements des donn\u00E9es personnelles sont uniquement r\u00E9alis\u00E9s pour les ` +
    `besoins de la mise en place et de l'ex\u00E9cution des parrainages immobiliers et afin d'ex\u00E9cuter ` +
    `au mieux les services d'interm\u00E9diation propos\u00E9s sur la plateforme ${agency.name}.`
  );

  para(
    `12.3 - Les donn\u00E9es personnelles trait\u00E9es par ${agency.name} sont collect\u00E9es, trait\u00E9es et conserv\u00E9es ` +
    `conform\u00E9ment \u00E0 la r\u00E9glementation relative \u00E0 la protection des donn\u00E9es et selon les dur\u00E9es des ` +
    `prescriptions l\u00E9gales.`
  );

  para(
    `12.4 - Le PARRAIN et le FILLEUL b\u00E9n\u00E9ficient des droits suivants : le droit de demander l'acc\u00E8s ` +
    `et la rectification de leurs donn\u00E9es personnelles, le droit de demander la limitation du traitement, ` +
    `le droit \u00E0 la portabilit\u00E9 des donn\u00E9es, le droit de retirer leur consentement \u00E0 tout moment, ` +
    `le droit \u00E0 l'effacement de leurs donn\u00E9es personnelles.`
  );

  para(
    `Ces droits peuvent \u00EAtre exerc\u00E9s \u00E0 tout moment par email \u00E0 l'adresse ${agency.email} ` +
    `ou par courrier postal \u00E0 l'adresse : ${agency.name}, ${agency.address}, ${agency.postalCode} ${agency.city}.`
  );

  y += 5;

  // ── INFORMATIONS LEGALES ──
  if (y > 230) { addFooter(doc, M); doc.addPage(); y = M; }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(M, y, W, 7, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text("INFORMATIONS LEGALES", M + 3, y + 5);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const legalLines = [
    `${agency.legalName}, ${agency.legalForm} au capital de ${agency.capital} \u20AC`,
    `RCS ${agency.rcs} n\u00B0 ${agency.rcsNumber} - SIRET ${agency.siret}`,
    `Carte professionnelle : ${agency.cartePro.type} n\u00B0 ${agency.cartePro.number}`,
    `D\u00E9livr\u00E9e par ${agency.cartePro.deliveredBy}, ${agency.cartePro.cciAddress}`,
    `Garantie financi\u00E8re : ${agency.garantie.caisse}, ${agency.garantie.address}, n\u00B0 ${agency.garantie.number}, montant ${agency.garantie.amount} \u20AC`,
    `Compte s\u00E9questre n\u00B0 ${agency.sequestre.number} ouvert aupr\u00E8s ${agency.sequestre.bank}`,
    `Assurance RC Pro : ${agency.assurance.company} (${agency.assurance.address})`,
    `TVA intracommunautaire : ${agency.tva}`,
  ];
  legalLines.forEach(l => {
    if (y > 275) { addFooter(doc, M); doc.addPage(); y = M; }
    doc.text(l, M, y);
    y += 4;
  });

  y += 10;

  // ── DATE & SIGNATURES ──
  if (y > 210) { addFooter(doc, M); doc.addPage(); y = M; }

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");
  doc.text(`Fait \u00E0 ${agency.city}, le ${fmtDate(contract.signedAt || contract.createdAt)}`, M, y);
  y += 12;

  const sigBoxW = (W - 10) / 2;

  // Agence box
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(M, y, sigBoxW, 40, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`L'AGENCE \u2014 ${agency.name}`, M + 3, y + 6);
  if (contract.adminSignature?.startsWith("data:image")) {
    try { doc.addImage(contract.adminSignature, "PNG", M + 5, y + 10, sigBoxW - 10, 22); } catch { /* skip */ }
  } else if (contract.adminSignature) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(contract.adminSignature, M + 3, y + 22);
  } else {
    doc.setTextColor(200, 210, 220);
    doc.text("En attente de signature", M + 3, y + 22);
  }

  // Ambassador box
  const sigX2 = M + sigBoxW + 10;
  doc.roundedRect(sigX2, y, sigBoxW, 40, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const sigLabel = ambLegalStatus === "SOCIETE" && contract.ambassador?.companyName
    ? `LE PARRAIN \u2014 ${contract.ambassador.companyName}`
    : ambLegalStatus === "ASSOCIATION" && contract.ambassador?.associationName
    ? `LE PARRAIN \u2014 ${contract.ambassador.associationName}`
    : `LE PARRAIN \u2014 ${ambassadorName}`;
  doc.text(sigLabel.substring(0, 45), sigX2 + 3, y + 6);
  if (contract.ambassadorSignature?.startsWith("data:image")) {
    try { doc.addImage(contract.ambassadorSignature, "PNG", sigX2 + 5, y + 10, sigBoxW - 10, 22); } catch { /* skip */ }
  } else if (contract.ambassadorSignature) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(contract.ambassadorSignature, sigX2 + 3, y + 22);
  } else {
    doc.setTextColor(200, 210, 220);
    doc.text("En attente de signature", sigX2 + 3, y + 22);
  }

  y += 48;
  if (contract.signedAt) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Sign\u00E9 \u00E9lectroniquement le ${fmtDate(contract.signedAt)}`, pageW / 2, y, { align: "center" });
  }

  // Footer on last page
  addFooter(doc, M);

  doc.save(`contrat-${contract.number}.pdf`);
}

// ─── ACKNOWLEDGMENT PDF ────────────────────────────────────────────
export function generateAcknowledgmentPDF(ack: any, contract: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const M = 20;
  let y = M;

  // Header
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(agency.name, M, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Reconnaissance d'Honoraires", M, 21);
  doc.text(`N\u00B0 ${ack.number}`, pageW - M, 14, { align: "right" });

  y = 45;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RECONNAISSANCE D'HONORAIRES", pageW / 2, y, { align: "center" });

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`R\u00E9f\u00E9rence contrat : ${contract.number}`, pageW / 2, y, { align: "center" });

  y += 20;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  const ambassadorFullName = contract.ambassador?.user?.name || contract.ambassadorName || "_______________";
  const ackLegalStatus = contract.ambassador?.legalStatus || "PARTICULIER";

  let bodyText: string;
  if (ackLegalStatus === "SOCIETE" && contract.ambassador?.companyName) {
    bodyText = `La soci\u00E9t\u00E9 ${contract.ambassador.companyName}` +
      (contract.ambassador.companyLegalForm ? ` (${contract.ambassador.companyLegalForm})` : "") +
      (contract.ambassador.companySiret ? `, SIRET ${contract.ambassador.companySiret}` : "") +
      `, repr\u00E9sent\u00E9e par ${ambassadorFullName}, en qualit\u00E9 d'apporteur d'affaire, reconnait avoir droit au versement de la somme de :`;
  } else if (ackLegalStatus === "ASSOCIATION" && contract.ambassador?.associationName) {
    bodyText = `L'association ${contract.ambassador.associationName}` +
      (contract.ambassador.associationRna ? ` (RNA ${contract.ambassador.associationRna})` : "") +
      `, repr\u00E9sent\u00E9e par ${ambassadorFullName}, en qualit\u00E9 d'apporteur d'affaire, reconnait avoir droit au versement de la somme de :`;
  } else {
    bodyText = `Je soussign\u00E9(e) ${ambassadorFullName}, en qualit\u00E9 d'apporteur d'affaire, reconnais avoir droit au versement de la somme de :`;
  }
  const lines = doc.splitTextToSize(bodyText, pageW - M * 2);
  doc.text(lines, M, y);
  y += lines.length * 6 + 10;

  // Amount highlight — HT / TTC selon statut juridique
  const amountHT = ack.amount;
  const legalStatus = contract.ambassador?.legalStatus || "PARTICULIER";
  const hasTVA = legalStatus === "SOCIETE";

  const boxH = hasTVA ? 38 : 25;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(M, y, pageW - M * 2, boxH, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(5, 150, 105);

  if (hasTVA) {
    const tvaAmount = amountHT * 0.20;
    const amountTTC = amountHT * 1.20;
    doc.text(fmt(amountTTC), pageW / 2, y + 14, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Montant HT : ${fmt(amountHT)}  |  TVA (20%) : ${fmt(tvaAmount)}  |  Montant TTC : ${fmt(amountTTC)}`, pageW / 2, y + 24, { align: "center" });
  } else {
    doc.text(fmt(amountHT), pageW / 2, y + 16, { align: "center" });
  }
  y += boxH + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  if (ack.description) {
    doc.text(`Motif : ${ack.description}`, M, y);
    y += 8;
  }
  doc.text(`Au titre du contrat d'apporteur d'affaire N\u00B0 ${contract.number}`, M, y);
  y += 8;
  if (contract.propertyAddress) {
    doc.text(`Pour le bien situ\u00E9 : ${contract.propertyAddress}`, M, y);
    y += 8;
  }

  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Mode de paiement : ${agency.payment.methods}`, M, y);
  y += 5;
  doc.text(`D\u00E9lai de paiement : ${agency.payment.delay}`, M, y);
  y += 15;

  // Signatures
  const sigBoxW = (pageW - M * 2 - 10) / 2;
  doc.setDrawColor(203, 213, 225);

  // Agency signature box
  doc.roundedRect(M, y, sigBoxW, 40, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`L'AGENCE \u2014 ${agency.name}`, M + 3, y + 6);
  // Use ack.adminSignature first (dual-sig flow), fallback to contract.adminSignature
  const ackAdminSig = ack.adminSignature || contract.adminSignature;
  if (ackAdminSig?.startsWith("data:image")) {
    try { doc.addImage(ackAdminSig, "PNG", M + 5, y + 8, sigBoxW - 10, 25); } catch { /* skip */ }
  } else if (ackAdminSig) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(ackAdminSig, M + 3, y + 22);
  } else {
    doc.setTextColor(200, 210, 220);
    doc.text("En attente de contresignature", M + 3, y + 22);
  }

  // Ambassador signature box
  const sigX2 = M + sigBoxW + 10;
  doc.roundedRect(sigX2, y, sigBoxW, 40, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const ackSigLabel = ackLegalStatus === "SOCIETE" && contract.ambassador?.companyName
    ? `LE PARRAIN \u2014 ${contract.ambassador.companyName}`
    : ackLegalStatus === "ASSOCIATION" && contract.ambassador?.associationName
    ? `LE PARRAIN \u2014 ${contract.ambassador.associationName}`
    : `LE PARRAIN \u2014 ${ambassadorFullName}`;
  doc.text(ackSigLabel.substring(0, 45), sigX2 + 3, y + 6);
  if (ack.ambassadorSignature?.startsWith("data:image")) {
    try { doc.addImage(ack.ambassadorSignature, "PNG", sigX2 + 5, y + 8, sigBoxW - 10, 25); } catch { /* skip */ }
  } else if (ack.ambassadorSignature) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(ack.ambassadorSignature, sigX2 + 3, y + 22);
  } else {
    doc.setTextColor(200, 210, 220);
    doc.text("En attente de signature", sigX2 + 3, y + 22);
  }

  y += 48;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Document g\u00E9n\u00E9r\u00E9 le ${fmtDate(new Date())} \u00B7 ${agency.name}`, pageW / 2, y, { align: "center" });

  // Footer
  addFooter(doc, M);

  doc.save(`reconnaissance-honoraires-${ack.number}.pdf`);
}

// ─── BATCH EXPORT: all acknowledgments for a contract ──────────────
export function generateAllAcknowledgmentsPDF(acks: any[], contract: any) {
  if (acks.length === 0) return;
  if (acks.length === 1) return generateAcknowledgmentPDF(acks[0], contract);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const M = 20;

  acks.forEach((ack, index) => {
    if (index > 0) doc.addPage();
    let y = M;

    // Header
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(agency.name, M, 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Reconnaissance d'Honoraires", M, 21);
    doc.text(`N\u00B0 ${ack.number}`, pageW - M, 14, { align: "right" });
    doc.text(`${index + 1} / ${acks.length}`, pageW - M, 21, { align: "right" });

    y = 45;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RECONNAISSANCE D'HONORAIRES", pageW / 2, y, { align: "center" });
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`R\u00E9f\u00E9rence contrat : ${contract.number}`, pageW / 2, y, { align: "center" });
    y += 15;

    // Ambassador info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    const ambassadorFullName = contract.ambassador?.user?.name || "_______________";
    doc.text(`Ambassadeur : ${ambassadorFullName}`, M, y);
    y += 8;

    // Amount
    const amountHT = ack.amount;
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(M, y, pageW - M * 2, 20, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text(fmt(amountHT), pageW / 2, y + 14, { align: "center" });
    y += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    if (ack.description) { doc.text(`Motif : ${ack.description}`, M, y); y += 7; }
    doc.text(`Statut : ${ack.status}`, M, y); y += 7;
    if (ack.paidAt) { doc.text(`Pay\u00E9e le : ${fmtDate(ack.paidAt)}`, M, y); y += 7; }
    y += 10;

    // Signatures
    const sigBoxW = (pageW - M * 2 - 10) / 2;
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(M, y, sigBoxW, 35, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`L'AGENCE`, M + 3, y + 6);
    const ackAdminSig = ack.adminSignature || contract.adminSignature;
    if (ackAdminSig?.startsWith("data:image")) {
      try { doc.addImage(ackAdminSig, "PNG", M + 5, y + 8, sigBoxW - 10, 20); } catch { /* skip */ }
    }

    const sigX2 = M + sigBoxW + 10;
    doc.roundedRect(sigX2, y, sigBoxW, 35, 2, 2, "S");
    doc.text(`LE PARRAIN`, sigX2 + 3, y + 6);
    if (ack.ambassadorSignature?.startsWith("data:image")) {
      try { doc.addImage(ack.ambassadorSignature, "PNG", sigX2 + 5, y + 8, sigBoxW - 10, 20); } catch { /* skip */ }
    }

    addFooter(doc, M);
  });

  doc.save(`reconnaissances-${contract.number}.pdf`);
}
