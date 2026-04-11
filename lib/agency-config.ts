export const agency = {
  name: "LA BRIE IMMOBILIERE",
  legalName: "SARL LA BRIE IMMOBILIERE",
  legalForm: "SARL",
  capital: "100 000",
  siret: "48525508700010",
  rcs: "Créteil",
  rcsNumber: "485255087",
  tva: "FR 40485255087",
  address: "41, avenue du Maréchal de Lattre de Tassigny",
  postalCode: "94440",
  city: "VILLECRESNES",
  phone: "01 45 99 11 37",
  email: "contact@labrieimmobiliere.fr",
  emailVillecresnes: "villecresnes@labrieimmobiliere.fr",
  website: "www.labrieimmobiliere.fr",

  // Carte professionnelle
  cartePro: {
    type: "Transaction sur Immeuble et Fond de Commerce",
    number: "CPI 9401 2016 000 015 459",
    deliveredBy: "CCI PARIS ILE DE FRANCE - 75",
    cciAddress: "27, Avenue de Friedland - 75008 Paris",
  },

  // Garantie financière
  garantie: {
    caisse: "GALIAN",
    address: "89, rue La Boétie - 75008 Paris",
    number: "27998H",
    amount: "300 000",
  },

  // Compte séquestre
  sequestre: {
    number: "00022204059",
    bank: "Société Générale",
  },

  // Assurance RC Pro
  assurance: {
    company: "MMA IARD",
    address: "14, Bd Marie et Alexandre Oyon 72030 Le Mans CEDEX 9",
  },

  // Commission ambassadeur
  commission: {
    type: "PERCENTAGE" as const,
    value: 5, // 5% des honoraires HT
    description: "5% des honoraires HT jet hors charges sociales perçus par le PARTENAIRE ayant réalisé l'opération",
  },

  // Conditions de paiement
  payment: {
    methods: "virement bancaire ou chèque",
    delay: "60 jours maximum après la signature de l'acte définitif de l'affaire recommandée",
  },
} as const;
