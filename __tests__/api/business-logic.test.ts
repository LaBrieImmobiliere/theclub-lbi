import { describe, it, expect } from "vitest";

// ─── Commission Calculation Tests ────────────────────────────────
describe("Commission calculation", () => {
  // Replicate the logic from app/api/contrats/[id]/route.ts
  function calculateCommission(
    commissionType: string,
    commissionValue: number,
    honoraires: number | null,
    existingAmount: number | null
  ): number | null {
    const cType = commissionType;
    const cValue = commissionValue;
    const cHonoraires = honoraires;
    let commissionAmount = existingAmount;
    if (cType === "PERCENTAGE" && cHonoraires && cValue) {
      commissionAmount = (cHonoraires * cValue) / 100;
    } else if (cType === "FIXED" && cValue) {
      commissionAmount = cValue;
    }
    return commissionAmount;
  }

  it("calculates percentage commission correctly", () => {
    expect(calculateCommission("PERCENTAGE", 5, 10000, null)).toBe(500);
  });

  it("calculates percentage with different rates", () => {
    expect(calculateCommission("PERCENTAGE", 10, 25000, null)).toBe(2500);
  });

  it("uses fixed amount directly", () => {
    expect(calculateCommission("FIXED", 1500, null, null)).toBe(1500);
  });

  it("recalculates when honoraires change", () => {
    expect(calculateCommission("PERCENTAGE", 5, 20000, 500)).toBe(1000);
  });

  it("keeps existing amount when no data provided", () => {
    expect(calculateCommission("PERCENTAGE", 0, null, 750)).toBe(750);
  });
});

// ─── Status Transition Tests ─────────────────────────────────────
describe("Lead status transitions", () => {
  const LEAD_STATUS_STEPS = [
    "NOUVEAU",
    "PRIS_EN_CHARGE",
    "CONTACTE",
    "RDV_PLANIFIE",
    "EN_NEGOCIATION",
    "MANDAT_SIGNE",
    "SOUS_OFFRE",
    "COMPROMIS_SIGNE",
    "ACTE_SIGNE",
    "RECONNAISSANCE_HONORAIRES",
    "COMMISSION_VERSEE",
    "CLOTURE",
  ];

  it("has 12 steps in the workflow", () => {
    expect(LEAD_STATUS_STEPS).toHaveLength(12);
  });

  it("RECONNAISSANCE_HONORAIRES comes after ACTE_SIGNE", () => {
    const acteIdx = LEAD_STATUS_STEPS.indexOf("ACTE_SIGNE");
    const recoIdx = LEAD_STATUS_STEPS.indexOf("RECONNAISSANCE_HONORAIRES");
    expect(recoIdx).toBe(acteIdx + 1);
  });

  it("CLOTURE is the last step", () => {
    expect(LEAD_STATUS_STEPS[LEAD_STATUS_STEPS.length - 1]).toBe("CLOTURE");
  });

  it("COMMISSION_VERSEE comes before CLOTURE", () => {
    const commIdx = LEAD_STATUS_STEPS.indexOf("COMMISSION_VERSEE");
    const closeIdx = LEAD_STATUS_STEPS.indexOf("CLOTURE");
    expect(closeIdx).toBe(commIdx + 1);
  });
});

// ─── Acknowledgment Status Flow Tests ────────────────────────────
describe("Acknowledgment dual-signature flow", () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    EN_ATTENTE: ["SIGNEE_AMBASSADEUR"],
    SIGNEE_AMBASSADEUR: ["CONTRESIGNEE"],
    CONTRESIGNEE: ["PAYEE"],
    PAYEE: [],
  };

  it("EN_ATTENTE can only go to SIGNEE_AMBASSADEUR", () => {
    expect(VALID_TRANSITIONS["EN_ATTENTE"]).toEqual(["SIGNEE_AMBASSADEUR"]);
  });

  it("SIGNEE_AMBASSADEUR can only go to CONTRESIGNEE", () => {
    expect(VALID_TRANSITIONS["SIGNEE_AMBASSADEUR"]).toEqual(["CONTRESIGNEE"]);
  });

  it("CONTRESIGNEE can only go to PAYEE", () => {
    expect(VALID_TRANSITIONS["CONTRESIGNEE"]).toEqual(["PAYEE"]);
  });

  it("PAYEE is a terminal state", () => {
    expect(VALID_TRANSITIONS["PAYEE"]).toEqual([]);
  });

  it("ambassador must sign before admin can countersign", () => {
    // Simulating the API check
    const ackStatus = "EN_ATTENTE";
    const canAdminCountersign = ackStatus === "SIGNEE_AMBASSADEUR";
    expect(canAdminCountersign).toBe(false);
  });

  it("admin can countersign after ambassador signs", () => {
    const ackStatus = "SIGNEE_AMBASSADEUR";
    const canAdminCountersign = ackStatus === "SIGNEE_AMBASSADEUR";
    expect(canAdminCountersign).toBe(true);
  });
});

// ─── TVA Calculation Tests ───────────────────────────────────────
describe("TVA calculation", () => {
  const TVA_RATE = 0.20;

  function isAssujettTVA(legalStatus?: string | null) {
    return legalStatus === "SOCIETE";
  }

  function commissionTTC(ht: number, legalStatus?: string | null) {
    if (!isAssujettTVA(legalStatus)) return ht;
    return ht * (1 + TVA_RATE);
  }

  function commissionTVA(ht: number, legalStatus?: string | null) {
    if (!isAssujettTVA(legalStatus)) return 0;
    return ht * TVA_RATE;
  }

  it("no TVA for PARTICULIER", () => {
    expect(commissionTVA(1000, "PARTICULIER")).toBe(0);
    expect(commissionTTC(1000, "PARTICULIER")).toBe(1000);
  });

  it("no TVA for ASSOCIATION", () => {
    expect(commissionTVA(1000, "ASSOCIATION")).toBe(0);
    expect(commissionTTC(1000, "ASSOCIATION")).toBe(1000);
  });

  it("20% TVA for SOCIETE", () => {
    expect(commissionTVA(1000, "SOCIETE")).toBe(200);
    expect(commissionTTC(1000, "SOCIETE")).toBe(1200);
  });

  it("no TVA when legalStatus is null/undefined", () => {
    expect(commissionTVA(1000, null)).toBe(0);
    expect(commissionTVA(1000, undefined)).toBe(0);
    expect(commissionTTC(1000, null)).toBe(1000);
  });
});

// ─── Acknowledgment Number Generation Tests ──────────────────────
describe("Acknowledgment number generation", () => {
  function generateAcknowledgmentNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `RH-${year}-${random}`;
  }

  it("starts with RH-", () => {
    const num = generateAcknowledgmentNumber();
    expect(num).toMatch(/^RH-/);
  });

  it("contains current year", () => {
    const num = generateAcknowledgmentNumber();
    expect(num).toContain(new Date().getFullYear().toString());
  });

  it("has correct format RH-YYYY-XXXX", () => {
    const num = generateAcknowledgmentNumber();
    expect(num).toMatch(/^RH-\d{4}-\d{4}$/);
  });

  it("generates unique numbers", () => {
    const nums = new Set(Array.from({ length: 100 }, () => generateAcknowledgmentNumber()));
    // With 10000 possible values, 100 attempts should almost certainly all be unique
    expect(nums.size).toBeGreaterThan(90);
  });
});
