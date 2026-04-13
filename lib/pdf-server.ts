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

/**
 * Generate contract CGU PDF as a Buffer for email attachment.
 * Simplified version: header + parties + key terms + signatures.
 */
export function generateContractPDFBuffer(contract: any): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const M = 20;
  const W = pageW - M * 2;
  let y = M;

  const ambassadorName = contract.ambassador?.user?.name || "_______________";
  const ambassadorEmail = contract.ambassador?.user?.email || "";

  // Header
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

  // Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("CONDITIONS GENERALES D'UTILISATION DES SERVICES", pageW / 2, y, { align: "center" });
  y += 6;
  doc.text(agency.name, pageW / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.text("A DESTINATION DES PARRAINS APPORTEURS D'AFFAIRES", pageW / 2, y, { align: "center" });
  y += 12;

  // Parties
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ENTRE :", M, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y = writeBlock(doc,
    `La soci\u00E9t\u00E9 ${agency.legalName}, ${agency.legalForm} au capital de ${agency.capital} \u20AC, ` +
    `inscrite au RCS de ${agency.rcs} sous le num\u00E9ro ${agency.rcsNumber}, ` +
    `sise ${agency.address} ${agency.postalCode} ${agency.city}.`,
    M, y, W, 4.5, M);
  y += 5;

  doc.setFont("helvetica", "italic");
  doc.text(`Ci-apr\u00E8s d\u00E9nomm\u00E9e \u00AB ${agency.name} \u00BB`, pageW - M, y, { align: "right" });
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("ET", M, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text(`Nom : ${ambassadorName}`, M, y); y += 5;
  if (ambassadorEmail) { doc.text(`Email : ${ambassadorEmail}`, M, y); y += 5; }
  y += 3;

  doc.setFont("helvetica", "italic");
  doc.text("Ci-dessous d\u00E9nomm\u00E9(e) le \u00AB PARRAIN \u00BB", pageW - M, y, { align: "right" });
  y += 15;

  // Key terms summary
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  y = writeBlock(doc,
    "Le pr\u00E9sent contrat r\u00E9git les conditions g\u00E9n\u00E9rales d'utilisation du dispositif de parrainage " +
    `${agency.name}. Les conditions compl\u00E8tes (articles 1 \u00E0 12) sont consultables ` +
    "dans l'espace personnel du parrain sur l'application.",
    M, y, W, 4.5, M);
  y += 10;

  // Commission info
  if (contract.commissionAmount || contract.commissionValue) {
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(M, y, W, 20, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105);
    const amount = contract.commissionAmount || contract.commissionValue;
    doc.text(`Commission : ${fmt(amount)}`, pageW / 2, y + 13, { align: "center" });
    y += 28;
  }

  // Signatures
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");
  doc.text(`Fait \u00E0 ${agency.city}, le ${fmtDate(contract.signedAt || contract.createdAt)}`, M, y);
  y += 12;

  const sigBoxW = (W - 10) / 2;
  doc.setDrawColor(203, 213, 225);

  // Agency signature
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
  }

  // Ambassador signature
  const sigX2 = M + sigBoxW + 10;
  doc.roundedRect(sigX2, y, sigBoxW, 40, 2, 2, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`LE PARRAIN \u2014 ${ambassadorName}`, sigX2 + 3, y + 6);
  if (contract.ambassadorSignature?.startsWith("data:image")) {
    try { doc.addImage(contract.ambassadorSignature, "PNG", sigX2 + 5, y + 10, sigBoxW - 10, 22); } catch { /* skip */ }
  } else if (contract.ambassadorSignature) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(contract.ambassadorSignature, sigX2 + 3, y + 22);
  }

  addFooter(doc, M);
  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Generate acknowledgment PDF as a Buffer for email attachment
 */
export function generateAcknowledgmentPDFBuffer(ack: any, contract: any): Buffer {
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
  const ambassadorFullName = contract.ambassador?.user?.name || "_______________";
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

  // Amount highlight
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
  const ackAdminSig = ack.adminSignature || contract.adminSignature;
  if (ackAdminSig?.startsWith("data:image")) {
    try { doc.addImage(ackAdminSig, "PNG", M + 5, y + 8, sigBoxW - 10, 25); } catch { /* skip */ }
  } else if (ackAdminSig) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(ackAdminSig, M + 3, y + 22);
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
  }

  y += 48;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Document g\u00E9n\u00E9r\u00E9 le ${fmtDate(new Date())} \u00B7 ${agency.name}`, pageW / 2, y, { align: "center" });

  addFooter(doc, M);

  return Buffer.from(doc.output("arraybuffer"));
}
