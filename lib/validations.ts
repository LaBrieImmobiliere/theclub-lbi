import { z } from "zod";

export const createLeadSchema = z.object({
  firstName: z.string().min(1, "Pr\u00e9nom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().min(1, "T\u00e9l\u00e9phone requis").max(20),
  type: z.enum(["ACHAT", "VENTE", "LOCATION", "INVESTISSEMENT", "AUTRE"]),
  description: z.string().max(2000).optional(),
  budget: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  ambassadorId: z.string().optional(),
});

export const updateLeadSchema = z.object({
  status: z.enum(["NOUVEAU", "CONTACTE", "EN_COURS", "SIGNE", "PERDU"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createContractSchema = z.object({
  ambassadorId: z.string().min(1, "Ambassadeur requis"),
  leadId: z.string().optional().nullable(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]),
  commissionValue: z.number().min(0).max(100_000),
  propertyAddress: z.string().max(500).optional(),
  propertyPrice: z.number().min(0).optional().nullable(),
  honoraires: z.number().min(0).optional().nullable(),
  notes: z.string().max(2000).optional(),
});

export const updateContractSchema = z.object({
  status: z.enum(["BROUILLON", "ENVOYE", "SIGNE", "PAYE", "ANNULE"]).optional(),
  commissionType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  commissionValue: z.number().min(0).optional(),
  propertyAddress: z.string().max(500).optional(),
  propertyPrice: z.number().min(0).optional().nullable(),
  honoraires: z.number().min(0).optional().nullable(),
  commissionAmount: z.number().min(0).optional(),
  adminSignature: z.string().optional(),
  ambassadorSignature: z.string().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  image: z.string().optional().nullable(),
  onboarded: z.boolean().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Minimum 6 caract\u00e8res").optional(),
});

export const createBroadcastSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  content: z.string().min(1, "Contenu requis").max(5000),
  target: z.enum(["ALL", "AMBASSADORS", "NEGOTIATORS"]).default("ALL"),
});

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1, "Message requis").max(5000),
});
