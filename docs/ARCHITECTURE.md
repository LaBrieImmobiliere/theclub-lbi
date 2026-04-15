# Architecture LBI Platform

> **Document de référence — v0.1 — 2026-04-15**
> Auteur : Alexandre Brites + Claude
> Statut : 🟡 Brouillon pour validation

---

## 0. Préambule

Ce document acte les décisions structurantes pour la construction de la plateforme logicielle de **LA BRIE IMMOBILIERE** (LBI). Il couvre :

1. La **vision produit** et les principes directeurs.
2. L'**architecture technique** (monorepo, stack, données, intégrations).
3. Le **découpage en deux applications** : le Club (existant) et Transactions (à construire).
4. Les **innovations produit** qui doivent rendre l'outil différenciant — pas juste "un énième CRM immobilier".
5. La **roadmap** de construction par phases livrables.

Le document est vivant. On l'itère jusqu'à validation, puis il devient le contrat qui cadre tous les choix d'implémentation.

---

## 1. Vision produit

### 1.1 Mission

> Faire de LBI l'agence immobilière la plus efficace, la plus transparente et la plus aimée de ses clients, grâce à un logiciel propriétaire qui automatise ce qui peut l'être et amplifie le travail humain là où il fait la différence.

### 1.2 Les trois convictions fondatrices

1. **Le logiciel est un avantage compétitif structurel**, pas un coût support. Chaque heure gagnée par un négociateur grâce à l'outil = une heure de plus en relation client = plus de mandats et plus de transactions.
2. **La transparence gagne la confiance**. Les vendeurs et acquéreurs veulent voir ce qui se passe sur leur dossier en temps réel, comme ils suivent une commande Amazon. Les agences qui cachent l'information vont perdre.
3. **Chaque bien a une histoire et chaque client a une psychologie.** Le logiciel doit capturer ces signaux et les rendre actionnables.

### 1.3 Principes directeurs (non-négociables)

| Principe | Traduction opérationnelle |
|---|---|
| **Mobile-first, terrain-first** | Un négociateur en voiture ou en visite doit pouvoir tout faire avec son téléphone. Pas de feature "desktop only". |
| **Offline-first** | Les données du jour sont en cache local. Synchro automatique au retour de réseau. |
| **Zéro saisie redondante** | Une donnée se saisit une fois. Tout le reste se génère. |
| **Tout est tracé** | Audit log immuable sur toute action métier sensible. |
| **Tout est réversible** | Suppression logique par défaut (soft delete + corbeille 30 jours). |
| **L'IA sert, elle ne décide pas** | L'IA propose, le négociateur valide. Jamais d'envoi automatique au client sans revue humaine sur le cœur de métier. |
| **Propriété des données** | Les clients peuvent exporter leurs données à tout moment. RGPD by design. |
| **Interopérabilité** | API publique dès la v1 pour notaires, banques, partenaires. |

---

## 2. Les deux produits

### 2.1 LBI Club (existant, à préserver)

- **Cible** : ambassadeurs externes (particuliers, sociétés, associations) qui recommandent des affaires contre commission.
- **Rôles** : `AMBASSADOR`, `NEGOTIATOR` (vue limitée), `ADMIN`.
- **Usage** : mobile léger, notifications push, peu de saisie, beaucoup de lecture.
- **URL cible** : `club.labrieimmobiliere.fr`
- **État actuel** : fonctionnel, en production Vercel.

### 2.2 LBI Pro (nouveau — nom à valider)

- **Cible** : collaborateurs internes (négociateurs, assistantes, directeurs d'agence, comptable, dirigeant).
- **Rôles** : `NEGOTIATOR`, `ASSISTANT`, `AGENCY_MANAGER`, `ACCOUNTANT`, `ADMIN`, `OWNER`.
- **Usage** : desktop dense pour le bureau + mobile rich pour le terrain.
- **URL cible** : `pro.labrieimmobiliere.fr` (ou `app.labrieimmobiliere.fr`)
- **État actuel** : à construire.

> **Alternatives de nommage pour LBI Pro** : `LBI Studio` (positionnement premium), `LBI Workspace`, `LBI Engine`. Décision à acter en Phase 0.

### 2.3 Portails clients (sous-domaines de LBI Pro)

- `vendeur.labrieimmobiliere.fr/[token]` — portail vendeur (voir §13).
- `acquereur.labrieimmobiliere.fr/[token]` — portail acquéreur.

Pas des apps séparées : ce sont des routes de LBI Pro avec auth par magic link + token signé (pas de création de compte pour les clients).

### 2.4 Pont fonctionnel Club ↔ Pro

```
┌─────────────────┐                     ┌─────────────────┐
│   LBI Club      │  ◄── events ──►     │   LBI Pro       │
│                 │                     │                 │
│  - Ambassadeurs │                     │  - Biens        │
│  - Leads bruts  │  Lead.created ────► │  - Mandats      │
│  - Commissions  │  ◄── Sale.closed    │  - Transactions │
│                 │                     │  - Facturation  │
└─────────────────┘                     └─────────────────┘
         ▲                                       ▲
         └──────────── DB partagée ──────────────┘
                  (Postgres / Prisma)
```

**Règles :**
- Club émet `Lead.created` → Pro crée automatiquement un `Contact` + une opportunité.
- Pro émet `Sale.closed` → Club crée automatiquement la commission ambassadeur + notification push.
- Même base de données, mais **schémas Prisma séparés** par domaine pour éviter le couplage.

---

## 3. Décisions d'architecture fondatrices

| # | Décision | Justification | Coût de revirement |
|---|---|---|---|
| **A1** | **Monorepo pnpm + turborepo** | Partage de code (UI, DB, auth, emails), déploiements indépendants, un seul PR pour un changement cross-app. | Faible si décidé maintenant, élevé dans 6 mois. |
| **A2** | **Deux apps Next.js distinctes** (Club + Pro) | UX radicalement différentes, cycles de release indépendants, risque de régression isolé. | Moyen. |
| **A3** | **Base Postgres unique**, schémas Prisma par domaine | Une seule source de vérité utilisateurs/agences, pas de synchro coûteuse. | Très élevé. |
| **A4** | **SSO via next-auth partagé**, cookie sur `.labrieimmobiliere.fr` | Un seul login, UX fluide entre les deux apps. | Élevé. |
| **A5** | **Event bus interne** (table `events` + worker Inngest) | Découplage Club/Pro, audit natif, rejouable. | Faible. |
| **A6** | **Multi-tenant dès le début** (discriminant `agencyId`) | Tu as déjà plusieurs agences + possibilité de commercialiser plus tard. | **Très élevé** si pas fait dès la Phase 0. |
| **A7** | **TypeScript strict partout**, Zod aux frontières | Types = documentation vivante, moins de bugs prod. | Faible. |
| **A8** | **Row-Level Security Postgres** (RLS) sur les tables sensibles | Défense en profondeur : même si la requête app est buggée, la DB refuse. | Moyen. |
| **A9** | **Feature flags** (packages/flags) | Déployer ≠ livrer. Tester en prod sur un sous-ensemble d'agences. | Faible. |
| **A10** | **Pas de microservices** | YAGNI. Monolithe modulaire suffit jusqu'à 100 agences. | Faible (on peut extraire plus tard). |

---

## 4. Stack technique

### 4.1 Frontend

| Couche | Choix | Motif |
|---|---|---|
| Framework | **Next.js 16** (App Router, React 19) | Déjà en place sur Club, RSC, streaming. ⚠️ Breaking changes — lire `node_modules/next/dist/docs/` avant d'écrire. |
| Styling | **Tailwind 4** + tokens CSS | Déjà en place. |
| UI | **Radix UI primitives** + composants maison dans `packages/ui` | Accessibilité native, pas de dette shadcn. |
| Formulaires | **react-hook-form + Zod** | Déjà en place. |
| État serveur | **Server Components + Server Actions** en priorité | RSC-first, pas de React Query par défaut. |
| État client | **Zustand** pour les cas complexes (cart visite, pipeline drag'n'drop) | Léger, pas de boilerplate Redux. |
| Charts | **Recharts** (déjà) + **Tremor** pour dashboards | Esthétique dashboards. |
| Tables | **TanStack Table v8** | Virtualisation, tri, filtres avancés. |
| Drag'n'drop | **dnd-kit** | Pour kanbans pipeline. |
| Date | **date-fns** (déjà) + **Temporal** (polyfill) | Gestion fuseaux pour rendez-vous. |
| Cartographie | **MapLibre GL** + tuiles IGN | Open-source, plus fin que Mapbox pour la France. |
| i18n | **next-intl** | Préparer ouverture hors France. |
| PWA | Service worker custom (déjà) | Offline-first pour terrain. |

### 4.2 Backend

| Couche | Choix | Motif |
|---|---|---|
| Runtime | **Node 22 LTS** (pas d'edge pour les routes critiques) | Compatible Prisma 7. |
| ORM | **Prisma 7** (déjà) | Productivité, migrations, types. |
| Base | **Postgres 16** (Neon ou Supabase en dev, Vercel Postgres en prod) | Fiabilité, RLS, JSONB, pg_vector pour embeddings. |
| Event bus | **Inngest** (jobs, workflows, retries) | Serverless, observabilité native, moins de code que BullMQ. |
| Cache | **Redis** (Upstash) | Sessions, rate limit, recherche récente. |
| Search | **Meilisearch** auto-hébergé (ou Typesense) | Full-text FR, typo-tolerant, instant search. |
| Vector | **pgvector** dans Postgres | Embeddings matching, pas d'infra en plus. |
| Storage | **Cloudflare R2** (S3-compatible) | Prix imbattable, egress gratuit, photos biens + docs. |
| Email | **Resend** + templates React Email | DX moderne, deliverability. |
| SMS | **Twilio** ou **Sinch** | Multi-canal (SMS, WhatsApp Business). |
| Push | Web Push (déjà) + APNs/FCM pour future app native | Déjà en place. |
| IA | **Anthropic Claude** (API) + **OpenAI** (embeddings) + **Mistral** (fallback FR) | Redondance, Mistral pour souveraineté. |
| OCR | **Tesseract.js** + **Claude Vision** pour les cas durs | Pièces d'identité, diagnostics. |
| PDF | **pdf-lib** (déjà) + **Puppeteer** pour templates complexes | |
| Signature | **Yousign** (eIDAS qualifiée) + `signature_pad` fallback (déjà) | Valeur juridique forte. |

### 4.3 Infrastructure

| Composant | Choix |
|---|---|
| Hébergement apps | Vercel (Pro plan) |
| DB | Vercel Postgres ou Neon Pro |
| Storage | Cloudflare R2 |
| Queue | Inngest |
| Monitoring | Sentry (déjà) + Vercel Analytics + PostHog |
| Logs | Axiom (alternative : Logtail) |
| Secrets | Vercel + Doppler (sync multi-env) |
| Domaine | `labrieimmobiliere.fr` — Cloudflare DNS |
| Email | Resend (transactionnel) + Brevo (marketing) |

### 4.4 Tooling (développement)

| Outil | Usage |
|---|---|
| **pnpm** | Gestionnaire de paquets (workspaces) |
| **turborepo** | Build + cache distribué |
| **TypeScript 5.x** strict | Partout |
| **ESLint 9 + Biome** | Lint + format |
| **Vitest** (déjà) | Unit tests |
| **Playwright** (déjà) | E2E |
| **Storybook** | Catalogue design system |
| **Chromatic** | Visual regression |
| **Renovate** | MAJ dépendances |
| **Husky + lint-staged** | Hooks pré-commit |
| **commitlint + conventional commits** | Historique git propre |

---

## 5. Structure du monorepo

### 5.1 Arborescence cible

```
lbi-platform/                          (repo racine)
├── apps/
│   ├── club/                          ← l'actuel app-lbi (ambassadeurs)
│   ├── pro/                           ← nouveau (transactions)
│   └── marketing/                     ← (phase ultérieure) site public labrieimmobiliere.fr
│
├── packages/
│   ├── db/                            ← Prisma, schémas, migrations, seeds
│   │   └── prisma/
│   │       ├── schema/
│   │       │   ├── core.prisma        ← User, Agency, AuditLog
│   │       │   ├── club.prisma        ← Ambassador, Lead, Contract (existant)
│   │       │   └── pro.prisma         ← Property, Mandate, Deal, Visit, Offer
│   │       └── migrations/
│   ├── auth/                          ← next-auth config partagée, SSO
│   ├── ui/                            ← design system (composants + tokens)
│   ├── emails/                        ← templates React Email
│   ├── integrations/
│   │   ├── yousign/
│   │   ├── dvf/                       ← Données des Valeurs Foncières (État)
│   │   ├── seloger/                   ← multi-diffusion
│   │   ├── leboncoin/
│   │   ├── bienici/
│   │   ├── notariat/                  ← GenApi / iNot
│   │   ├── stripe/                    ← paiement honoraires en ligne
│   │   └── banking/                   ← Pretto, Meilleurtaux API
│   ├── events/                        ← bus d'événements (types + publisher/subscriber)
│   ├── ai/                            ← wrappers Claude/OpenAI + prompts versionnés
│   ├── flags/                         ← feature flags
│   ├── audit/                         ← logger d'audit immuable
│   ├── rbac/                          ← permissions, guards, policies
│   ├── config/                        ← agency-config étendu, env vars
│   └── utils/                         ← helpers partagés (format, dates, etc.)
│
├── docs/
│   ├── ARCHITECTURE.md                ← ce document
│   ├── DATA_MODEL.md                  ← modèle de données détaillé
│   ├── RBAC.md                        ← matrice des permissions
│   ├── EVENTS.md                      ← catalogue des événements inter-apps
│   ├── INNOVATIONS.md                 ← brief par innovation (voir §13)
│   ├── COMPLIANCE.md                  ← Hoguet, RGPD, Tracfin, eIDAS
│   ├── DEPLOYMENT.md                  ← CI/CD, environnements
│   └── adr/                           ← Architecture Decision Records
│       ├── 0001-monorepo-turbo.md
│       ├── 0002-single-db.md
│       └── ...
│
├── .github/workflows/                 ← CI (tests, build, deploy)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

### 5.2 Dépendances entre packages

```
apps/club   ──┬──► packages/ui
              ├──► packages/auth ──► packages/db
              ├──► packages/emails
              ├──► packages/events
              ├──► packages/audit
              └──► packages/rbac

apps/pro    ──┬──► packages/ui
              ├──► packages/auth
              ├──► packages/emails
              ├──► packages/events
              ├──► packages/audit
              ├──► packages/rbac
              ├──► packages/integrations/*
              ├──► packages/ai
              └──► packages/flags
```

**Règle d'or** : aucune app ne dépend d'une autre app. Tout code partagé est dans `packages/*`.

---

## 6. Modèle de données

### 6.1 Domaines (namespaces Prisma)

| Domaine | Entités principales | Propriété |
|---|---|---|
| **Core** | `User`, `Agency`, `Membership`, `AuditLog`, `FeatureFlag` | Partagé Club + Pro |
| **Club** | `Ambassador`, `Lead`, `Contract` (= contrat ambassadeur), `HonoraryAcknowledgment`, `Badge`, `Review` | Club only |
| **Pro** | Voir §6.3 | Pro only |
| **Messaging** | `Conversation`, `Message`, `Notification`, `PushSubscription`, `Broadcast` | Partagé |
| **Billing** | `Invoice`, `Commission`, `Payment`, `EscrowAccount` | Partagé |
| **Events** | `Event`, `EventDelivery` | Infrastructure |

### 6.2 Multi-tenancy

- Toute entité métier porte `agencyId` (sauf Core User qui peut appartenir à plusieurs agences via `Membership`).
- Policies RLS Postgres : une session ne voit que les lignes de `current_setting('app.current_agency_id')`.
- Un `User` peut avoir des rôles différents dans différentes agences (utile pour un directeur multi-agences).

```prisma
model Membership {
  id        String   @id @default(cuid())
  userId    String
  agencyId  String
  role      Role     // OWNER | ADMIN | AGENCY_MANAGER | NEGOTIATOR | ASSISTANT | ACCOUNTANT | AMBASSADOR
  scope     Json     // permissions granulaires (ex: { canViewAllDeals: false, canEditPrices: true })
  status    String   @default("ACTIVE")
  joinedAt  DateTime @default(now())
  @@unique([userId, agencyId])
}
```

### 6.3 Entités clés — domaine Pro (transactions)

> Modèle haut-niveau. Le détail va dans `docs/DATA_MODEL.md` après validation.

**Biens & Mandats**
- `Property` (bien immobilier : adresse, surface, pièces, DPE, diagnostics, photos, plans, JSON étendu)
- `PropertyAsset` (photos, vidéos, scans 3D, plans, diagnostics — lien R2)
- `PropertyHistory` (historique travaux, factures, entretiens — alimente le "carnet digital du bien", voir §13.1)
- `Mandate` (mandat de vente/location : type, exclusivité, durée, commission, registre Hoguet)
- `MandateRegistry` (registre légal des mandats, numéroté par agence, immuable)
- `Valuation` (estimations successives : méthode, fourchette, explicable)

**Contacts & CRM**
- `Contact` (personne physique ou morale — unifié vendeur/acquéreur/proprio/notaire/autre)
- `ContactRole` (un contact peut être vendeur sur un bien ET acquéreur sur un autre)
- `SearchProfile` (recherche active d'un acquéreur : critères durs + description libre pour matching sémantique)
- `Preference` (préférences de communication : canal, horaires, fréquence)

**Cycle de transaction**
- `Deal` (opportunité = bien + vendeur + acquéreur potentiel, pipeline kanban)
- `DealStage` (configurable par agence)
- `Visit` (visite planifiée, réalisée, feedback, durée, signaux d'intention)
- `VisitReport` (compte-rendu structuré, signé par l'acquéreur — bon de visite)
- `Offer` (offre d'achat, historique des allers-retours, contre-offres)
- `PurchaseAgreement` (compromis / promesse unilatérale / offre acceptée)
- `NotaryDossier` (dossier notaire, checklist pièces, échéances, notaire assigné)
- `Closing` (acte authentique, date, prix final, commission répartie)

**Marketing & diffusion**
- `Listing` (annonce publiée sur un portail : SeLoger, LBC, etc. — statut, stats, ROI)
- `Campaign` (campagne marketing pour un bien ou une recherche — email, SMS, ads)
- `MarketSignal` (pige : bien apparu chez un particulier/concurrent, alerte)

**Back-office**
- `Commission` (répartition entre négociateur(s), ambassadeur, agence, apporteur externe)
- `Invoice` (facture honoraires, séquestre)
- `EscrowMovement` (mouvement sur compte séquestre SG)

### 6.4 Conventions

- IDs : `cuid()` partout (tri chrono, URL-safe).
- Timestamps : `createdAt`, `updatedAt`, `deletedAt` (soft delete).
- Audit : tout `UPDATE` sur entité métier écrit dans `AuditLog` via trigger Postgres.
- JSON : préférer colonnes typées, JSONB uniquement pour champs vraiment extensibles (ex: `Property.extendedAttributes`).
- Enums : via tables de référence, pas des enums Prisma (plus flexible).

---

## 7. Authentification & autorisations

### 7.1 SSO cross-app

- next-auth v5 dans `packages/auth`.
- Cookie de session sur **`.labrieimmobiliere.fr`** (parent domain) → partagé club + pro + portails clients.
- Providers : Credentials (email+password bcrypt), Google, Microsoft (pour les pros), Magic Link (pour les portails clients).
- **WebAuthn / Passkeys** dès la v1 (iOS 16+, Android 9+) — zéro password pour les collaborateurs.

### 7.2 Matrice des rôles (aperçu)

| Rôle | Club | Pro | Scope |
|---|---|---|---|
| `OWNER` | ✅ | ✅ | Toutes les agences, tout |
| `ADMIN` | ✅ | ✅ | Une ou plusieurs agences, config |
| `AGENCY_MANAGER` | lecture | ✅ | Une agence, pas de config billing |
| `NEGOTIATOR` | lecture limitée | ✅ | Ses biens + leads partagés |
| `ASSISTANT` | lecture | ✅ | Assistance, pas de décisionnel |
| `ACCOUNTANT` | lecture | lecture + billing | Finance only |
| `AMBASSADOR` | ✅ | ❌ | Ses recommandations, ses commissions |
| `CLIENT_VENDEUR` | ❌ | portail read-only | Son bien |
| `CLIENT_ACQUEREUR` | ❌ | portail read-only | Ses recherches |

Détail granulaire dans `docs/RBAC.md`.

### 7.3 Audit

Toute action sensible → entrée `AuditLog` immuable (insert only, pas d'update/delete). Colonnes : `userId`, `agencyId`, `action`, `entity`, `entityId`, `before` (JSON), `after` (JSON), `ip`, `userAgent`, `createdAt`.

---

## 8. Communication inter-apps (event bus)

### 8.1 Principe

Pas d'appels directs Club → Pro ou Pro → Club. Tout passe par des **événements typés** publiés dans une table `events`, consommés par des workers Inngest.

### 8.2 Exemples d'événements

| Event | Producteur | Consommateur | Action |
|---|---|---|---|
| `lead.created` | Club | Pro | Crée un `Contact` + un `Deal` en "À qualifier" |
| `lead.qualified` | Pro | Club | Notifie l'ambassadeur : "Ton lead est pris en charge" |
| `deal.stage_changed` | Pro | Club | Informe l'ambassadeur (si opt-in) |
| `sale.closed` | Pro | Club + Billing | Crée la `Commission` ambassadeur + déclenche facture |
| `commission.paid` | Billing | Club | Push à l'ambassadeur + update son tableau de bord |
| `property.listed` | Pro | Marketing | Pousse sur site vitrine + portails |
| `visit.completed` | Pro | Pro (soi-même, async) | Lance analyse IA du feedback, prédit intention d'achat |

Catalogue complet : `docs/EVENTS.md`.

### 8.3 Garanties

- **At-least-once delivery** (idempotence côté consommateur obligatoire).
- **Ordre non garanti** (sauf scope ex: même `dealId`).
- **Rejouable** : on peut rejouer les N derniers jours en cas de bug.
- **Observable** : dashboard Inngest des erreurs, dead letter queue.

---

## 9. Design system & UX

### 9.1 Positionnement visuel

- **Club** : chaleureux, orange/corail, rond, friendly (grand public).
- **Pro** : dense, neutre, sérieux, confiance (outil de travail). Palette inspirée de Linear / Attio / Pipedrive.
- **Portails clients** : minimal, aérien, premium (experience du client).

Les trois partagent **le même design system** (`packages/ui`) avec **3 thèmes de tokens** différents. Un seul système, trois peaux.

### 9.2 Tokens

- Couleurs sémantiques (`--color-surface`, `--color-accent`, `--color-danger`…), pas de hex en dur.
- Spacing en échelle (4, 8, 12, 16, 24, 32, 48, 64).
- Typo : Inter (UI) + Instrument Serif (titres marketing).
- Dark mode supporté partout dès v1.
- Contraste AA minimum, AAA visé sur textes principaux.

### 9.3 Composants obligatoires v1

Button, Input, Textarea, Select, Combobox, DatePicker, DateRangePicker, Dialog, Sheet, Drawer, Toast, Tooltip, Tabs, Accordion, Table (TanStack), DataGrid, Card, Badge, Avatar, Breadcrumb, CommandPalette (Cmd+K), Kanban, Timeline, FileUploader, SignaturePad, Map, Chart (Line/Bar/Area/Pie), Stat, EmptyState, Skeleton, ErrorBoundary.

### 9.4 Command Palette (Cmd+K) — obligatoire partout

Inspirée de Linear / Raycast. Recherche fuzzy sur tout (biens, contacts, deals, pages, actions). **Permet à un négociateur expert d'aller 5x plus vite que la souris.**

---

## 10. Déploiement & environnements

### 10.1 Environnements

| Env | URL Club | URL Pro | DB | But |
|---|---|---|---|---|
| `local` | localhost:3000 | localhost:3001 | SQLite dev.db | Dev |
| `preview` | PR-X.club.labrieimmobiliere.fr | PR-X.pro.labrieimmobiliere.fr | branche Neon | Review PR |
| `staging` | staging.club... | staging.pro... | staging DB | QA équipe |
| `production` | club... | pro... | prod DB | Utilisateurs réels |

### 10.2 CI/CD

- **Pré-commit** : lint, format, typecheck sur les fichiers modifiés.
- **Pull Request** : 
  - turborepo build (cache distribué)
  - vitest run (tests unit)
  - playwright run (tests e2e sur preview)
  - chromatic (visual regression sur storybook)
  - Vercel preview déployé
- **Merge sur `main`** : déploiement staging auto.
- **Tag `release/*`** : déploiement production (approbation manuelle).

### 10.3 Observabilité

- **Sentry** (erreurs + performance)
- **PostHog** (analytics produit, session replay, feature flags)
- **Vercel Analytics** (web vitals)
- **Inngest** (workflows, jobs)
- **Axiom** (logs centralisés, alerting)
- **Statuspage** (statut public)

### 10.4 Backup & disaster recovery

- Postgres PITR (point-in-time recovery) 7 jours.
- Snapshot quotidien sur R2, rétention 30 jours.
- Runbook d'incident : `docs/RUNBOOK.md`.
- RTO cible : 1h. RPO cible : 15min.

---

## 11. Intégrations tierces (priorisation)

### 11.1 Indispensables dès Phase 1

| Intégration | Usage | Coût |
|---|---|---|
| **Yousign** | Signature eIDAS qualifiée mandats/compromis | ~0,90€/signature |
| **Resend** | Emails transactionnels | 20$/mois |
| **Twilio / Sinch** | SMS + WhatsApp Business | pay-as-you-go |
| **Cloudflare R2** | Storage photos/docs | ~0,015$/GB |
| **Inngest** | Event bus / jobs | gratuit jusqu'à 50k runs/mois |
| **Sentry** | Monitoring | déjà en place |

### 11.2 Importantes Phase 2-3

| Intégration | Usage |
|---|---|
| **DVF** (api.cquest.org/dvf ou Etalab direct) | Estimation automatique basée sur ventes réelles |
| **API Adresse** (Etalab) | Normalisation adresses, géocodage |
| **API Cadastre** (IGN) | Parcelle, surface cadastrale, limites |
| **API PLU** (GPU) | Plan Local d'Urbanisme, servitudes |
| **Stripe** | Paiement honoraires en ligne (CB, SEPA) |
| **Pretto / Meilleurtaux** | Simulation financement acquéreur |
| **GenApi / iNot** | Échanges avec notaires |

### 11.3 Phase 4 (multi-diffusion)

Ubiflow (agrégateur → SeLoger + LBC + Bien'ici + 30+ portails) : ~150€/mois/agence, gain de temps énorme vs intégrations individuelles.

### 11.4 Phase 5+

- **Matterport / Giraffe360** (visite 3D)
- **OpenAI Whisper** (transcription appels)
- **Chatbot client** (WhatsApp + web)

---

## 12. Conformité & légal

### 12.1 Loi Hoguet (activité immobilière)

- **Carte T** LBI : `CPI 9401 2016 000 015 459` (déjà en config).
- **Garantie financière** GALIAN : 300 000€.
- **Compte séquestre** SG : `00022204059`.
- **Registre des mandats** : numérotation continue par agence, immuable, signé horodaté. → table `MandateRegistry` append-only.
- **Registre des répertoires** : idem pour les transactions.
- **Obligation de conservation** 10 ans des documents.

### 12.2 RGPD

- DPO désigné (à nommer, peut être externe).
- Registre des traitements tenu dans l'outil (`docs/RGPD_REGISTER.md`).
- Droit d'accès / rectification / effacement / portabilité : **endpoints API publics** pour chaque client.
- Mentions légales + politique de confidentialité : déjà présentes, à mettre à jour pour Pro.
- Anonymisation des données après 3 ans sans interaction.
- Chiffrement at-rest (Postgres) + in-transit (TLS 1.3).
- DPA signé avec chaque sous-traitant (Resend, Twilio, Vercel, OpenAI, Anthropic…).

### 12.3 Tracfin / LCB-FT

- Identification du client (vérification d'identité) : KYC intégré avec OCR + vérification documentaire.
- Vérification PPE (Personne Politiquement Exposée) : API Namescan / Dow Jones.
- Seuils de déclaration : 10 000€ cash (interdit de toute façon), 150 000€ "vigilance renforcée".
- Conservation des pièces 5 ans.
- Déclaration de soupçon (rare mais à prévoir) : formulaire dédié.

### 12.4 eIDAS (signature électronique)

- **Niveau "Simple"** (signature_pad actuel) : suffit pour bon de visite, mandat simple.
- **Niveau "Avancé"** (Yousign standard) : compromis, mandat exclusif.
- **Niveau "Qualifié"** (Yousign Qualified) : acte notarié si applicable — souvent chez le notaire.

### 12.5 Hébergement

- Serveurs Vercel en Europe (Francfort `fra1`).
- Pas de données de santé → pas de certification HDS nécessaire.
- Postgres en Europe.
- R2 Cloudflare : configurable EU-only.

---

## 13. 🚀 Innovations différenciantes

> Cette section est le cœur du document. On ne construit pas "encore un CRM". On construit des capacités qui n'existent pas ailleurs (ou qui existent isolément mais pas intégrées).

Classées en 4 familles : **Bien**, **Client**, **Négociateur**, **Management**. Chacune est un document détaillé dans `docs/innovations/*.md` avant implémentation.

---

### Famille A — Le bien augmenté

#### 🏠 A1. Carnet Digital du Bien (Property Passport)

Chaque bien a un **passeport numérique persistant**, attaché à l'adresse (pas au mandat). Il agrège :

- Photos datées (historique visuel du bien)
- Plans 2D et 3D
- Tous les diagnostics passés (DPE historique → courbe d'amélioration énergétique)
- Factures travaux, garanties décennales, artisans
- PV d'AG copro, règlement, charges, carnet d'entretien
- Historique des sinistres déclarés (optionnel, avec accord)
- Consommations énergétiques réelles (avec accord)
- Historique des prix demandés et prix obtenus
- Certificats d'urbanisme, déclarations préalables

**À la vente, le carnet est transmis à l'acquéreur** (droit de propriété sur ses données). Valeur perçue : énorme. Différenciation : totale.

> ✨ **Jamais vu sur le marché français**. MIL Registers au Royaume-Uni a ébauché l'idée, jamais industrialisée.

**Effet de réseau** : plus LBI vend de biens, plus la base de carnets s'enrichit. Un acquéreur qui revend 10 ans plus tard avec LBI → le carnet existe déjà, l'estimation est précise, la vente va 3x plus vite.

---

#### 📸 A2. Photo Studio IA intégré

Upload des photos brutes → traitement auto :
- Détection et floutage automatique : visages, plaques d'immatriculation, objets personnels sensibles (photos de famille sur les murs, documents sur bureau).
- Amélioration : balance des blancs, désaturation, redressement vertical, retrait ciel terne → ciel bleu léger (optionnel).
- **Home staging virtuel** : une pièce vide → meublée IA. Ou l'inverse (dégarnissage d'une pièce trop chargée).
- Détection qualité : score par photo, suggestions de prise de vue manquantes ("Il manque une photo salle de bain").
- Auto-tagging : cuisine, chambre, salon, extérieur → catégorisation pour l'annonce.

> Stack : Claude Vision + Stable Diffusion (Replicate API) + OpenCV.

---

#### 📝 A3. Rédaction d'annonce IA multi-plateforme

À partir des photos + caractéristiques + quartier :
- Titre optimisé SEO
- Description longue (site vitrine, emailing vendeur)
- Description courte (SeLoger : 1000 car., LBC : 800 car.)
- **Variations A/B** auto pour tester les performances
- Ton adaptable (factuel / chaleureux / premium / investisseur)
- Vérif légale : mentions DPE, mentions honoraires, mentions Hoguet
- Traduction EN / ES / IT / DE pour l'international (Villecresnes Orly, clientèle variée)

---

#### 🎥 A4. Vidéo immersive auto-générée

Upload des photos → vidéo 30-60s avec :
- Parcours cohérent (entrée → salon → cuisine → chambres → extérieur)
- Incrustation animée : m², prix/m², DPE, nb pièces
- Voix off IA (FR voix naturelle type ElevenLabs)
- Musique ambiance selon positionnement (premium / familial / investisseur)
- Export 9:16 Reels/TikTok, 16:9 YouTube, 1:1 Insta post.

> ROI démontré : les annonces avec vidéo performent 3x mieux sur LBC en 2025.

---

#### 📊 A5. Estimation explicable multi-sources

Pas une boîte noire. Pour chaque bien :
1. **DVF** (ventes réelles Etalab 5 dernières années dans 500m)
2. **Annonces actives** (scraping éthique + APIs)
3. **Historique agence** (nos propres ventes)
4. **Pondérations** : surface pondérée Carrez, étage, DPE, balcon/terrasse, cave, parking, état, exposition, bruit (Bruitparif), écoles (Education Nationale), commerces (OSM), transports (IDFM).

Résultat : **fourchette basse / médiane / haute + explication textuelle** "Votre bien vaut 8% de plus que la médiane du quartier grâce à son DPE C et son balcon, mais 5% de moins à cause de la vue sur rue passante."

> Pour le vendeur : confiance. Pour le négociateur : argumentaire ciselé.

---

#### 🗺️ A6. Radar de marché local

Alerte temps réel au négociateur :
- "Un bien similaire vient d'être mis en vente à 420k€ dans votre rue → votre mandat à 450k€ risque de dépérir."
- "Le bien concurrent au 12 rue de la Paix vient de baisser de 5% → suggérer un ajustement à notre vendeur."
- "Nouveau mandat chez [concurrent X] dans votre secteur → à surveiller."

Powered by pige légale + DVF + scraping structuré.

---

#### 🏗️ A7. Due Diligence automatisée (AI audit)

Upload du PV d'AG, du règlement de copro, du PLU, des diagnostics → Claude analyse et génère :
- Alertes rouges : "Ravalement voté en AG 2024, coût 15k€ par lot, non payé encore."
- Alertes oranges : "Chaudière 22 ans, remplacement à prévoir."
- Alertes urbanisme : "Permis de construire déposé à 150m, risque perte de vue."
- Alertes financières : "Fonds travaux copro insuffisant au regard du patrimoine."

> Différenciateur pour l'acquéreur. Limite le risque de rétractation post-compromis.

---

### Famille B — Le client augmenté

#### 👤 B1. Matching sémantique bien ↔ acquéreur

Pas juste "3 pièces Paris 15 < 800k€". L'acquéreur décrit librement :

> "On cherche un appartement lumineux pour télétravailler, avec un coin bureau possible, proche d'un parc pour la poussette, école publique correcte, pas trop bruyant. On accepte un peu de travaux si le cachet est là. Budget serré mais pas rigide."

Embeddings vectoriels (pgvector) + critères durs → matching pondéré. Le négociateur voit le score et **l'explication** : "Match 87% : lumineux ✅, parc à 300m ✅, école Jean Jaurès 4.2/5 ✅, rue calme ✅, potentiel coin bureau chambre 2 ✅. Travaux rafraîchissement ✓ (budget compatible)."

---

#### 💬 B2. Analyse de sentiment post-visite

À la fin d'une visite, l'acquéreur reçoit un mini-questionnaire (3 questions, 30 secondes). Combiné avec des signaux comportementaux :
- Temps passé sur l'annonce avant visite
- Nombre de retours sur l'annonce après visite
- Ouverture des emails de suivi
- Clics vers le simulateur de prêt
- Questions posées durant la visite (si dictées)

→ **Score d'intention d'achat** 0-100, mis à jour quotidiennement. Le négociateur sait **qui relancer en priorité** et avec quel message.

---

#### 🔗 B3. Portail vendeur ultra-transparent

Le vendeur se connecte (magic link) et voit en temps réel :
- **Statistiques annonce** : vues par portail, clics sur "contacter", favoris
- **Carte de chaleur** : d'où viennent les acquéreurs (proximité, arrondissement, région)
- **Comparaison marché** : son bien vs 5 biens similaires (pseudonymisés) — prix, délai de vente, nb de visites
- **Toutes les visites** : compte-rendu structuré, photo de l'acquéreur flouté (si consentement), signal d'intention
- **Toutes les offres reçues** : historique, contre-offres, statut
- **Simulation de décote** : "Si on baisse à X€, on projette vente en Y jours"
- **Dashboard mensuel exportable** (PDF envoyé auto)

> Objectif : le vendeur ne doit JAMAIS avoir à appeler pour "savoir où en est son bien".

---

#### 🏦 B4. Portail acquéreur — tableau de bord d'achat

L'acquéreur a son "cockpit" :
- **Ses recherches actives** avec alertes temps réel (push + email)
- **Ses biens favoris** + historique de prix
- **Simulation financement live** (Pretto API) → capacité d'emprunt actualisée mensuellement
- **Dossier financement pré-constitué** : upload une fois (bulletins de salaire, avis d'imposition, pièces ID, relevés) → réutilisé pour toutes les offres + pré-transmis aux courtiers partenaires
- **Suivi étapes notaire** : "Compromis signé le 02/03 → délai rétractation jusqu'au 12/03 → conditions suspensives jusqu'au 12/05 → acte prévu 15/06"
- **Checklist déménagement intégrée** (résiliation EDF, adresse, écoles, assurance habitation → partenaires)

---

#### 📱 B5. Communication multicanale unifiée

Le client peut choisir son canal préféré : Email, SMS, **WhatsApp Business**, appel. Toutes les conversations sont centralisées dans le CRM côté négociateur (1 fil par client, tous canaux confondus). Les pièces jointes échangées sont archivées auto dans le dossier.

> Inspiré de Front / Superhuman, appliqué à l'immo.

---

#### 🤝 B6. Parrainage client → ambassadeur seamless

Un acquéreur satisfait peut devenir ambassadeur en 1 clic depuis son portail → crée son compte Club, bascule dans l'écosystème, touche des commissions sur ses recommandations. Boucle vertueuse avec le Club existant.

---

### Famille C — Le négociateur augmenté

#### 🧠 C1. Copilote IA du négociateur

Résidant dans l'app, accessible Cmd+K ou chat latéral :
- **Résumé quotidien** : "Tu as 3 dossiers urgents aujourd'hui. Dossier Dupont : conditions suspensives qui expirent dans 5 jours, banque pas relancée depuis 10 jours. Dossier Martin : vendeur a appelé hier énervé par l'absence de retour, il faut le rappeler avant 11h."
- **Rédaction** : "Rédige une relance douce au vendeur Dupont" → propose, tu valides.
- **Détection signaux faibles** dans les conversations : divorce mentionné, bébé, mutation pro, héritage → tag + alerte.
- **Actions proposées** : "L'acquéreur Bernard a visité 2 biens cette semaine sans retour. Je lui envoie un SMS ?"
- **Questions sur le dossier** : "Combien on a mis de mandats exclusifs ce trimestre dans le 94 ?" → réponse directe.

Stack : Claude + MCP interne sur la DB (read-only, scoped par rôle).

---

#### 🎙️ C2. Dictée vocale + transcription appels

- Bouton "Dictée" partout : le négociateur en voiture dicte ses notes → transcrit et ajouté au bon dossier (IA comprend "ajoute sur le dossier du 12 rue de la Paix que le vendeur accepte une baisse de 10k€").
- Intégration téléphonie (Aircall / Ringover) : enregistrement appels avec consentement, transcription, résumé auto, action items extraits.
- "Replay" d'appel cherchable : "montre-moi les appels où j'ai parlé de travaux de toiture."

> Inspiré de Gong (sales), transposé à l'immo. **Aucun concurrent français ne le fait aujourd'hui.**

---

#### 📋 C3. Smart scheduling tripartite

Trouver un créneau entre vendeur + acquéreur + négociateur + (parfois notaire + banquier) en **1 lien partagé** type Calendly — mais qui tient compte de :
- Disponibilités synchronisées (Google/Outlook/iCloud)
- Proximité géographique des rendez-vous consécutifs (pas de Saint-Maur puis Villecresnes à 30min)
- Temps tampon personnalisé par rdv
- Trafic prévu (IDFM / Google Traffic)
- Préférences du client (créneaux matin/soir, jours autorisés)

---

#### 🛠️ C4. Workflow builder visuel

L'équipe peut créer ses propres automatisations sans coder, interface drag'n'drop type n8n/Zapier intégré :
- "Quand un mandat est signé → envoyer SMS au vendeur avec lien portail + créer tâche photos dans 48h + publier teaser Insta"
- "Quand une visite est terminée → attendre 2h → envoyer questionnaire + tâche relance négociateur dans 48h si pas de retour"

Autonomie des équipes → scalabilité du produit.

---

#### 🧪 C5. A/B testing des annonces

Deux versions du titre / de la photo de couverture / du prix affiché sont servies en rotation sur les portails où on contrôle l'affichage (site vitrine + emailing base). Au bout de 7 jours, la variante gagnante reste. Appliqué systématiquement, gain moyen attendu : +20% de clics.

---

#### 🚗 C6. Mode Terrain (offline + vocal + rapide)

Sur mobile, un mode spécial "visite" :
- Checkin géolocalisé au bien
- Photo rapide des points d'attention (humidité, travaux)
- Dictée vocale du compte-rendu
- Signature bon de visite sur place (tablette ou téléphone)
- Proposition d'une autre visite dans la journée auto (si acquéreur intéressé par un bien similaire, suggestion immédiate)
- Tout offline, synchro au retour de réseau

---

### Famille D — Le pilotage augmenté (management)

#### 📈 D1. Dashboard prédictif

Pas "combien j'ai vendu le mois dernier" (tout le monde sait faire). Mais :
- **Prédiction de CA** sur 3 mois glissants à partir du pipeline, des taux historiques par stade, de la saisonnalité, de la météo marché.
- **Détection d'anomalies** : "Ce mois-ci, le taux de transformation visite → offre est de 12% vs 22% habituel. Analyse : 3 négociateurs sur 5 ont un taux normal, 2 sont en difficulté → tel négociateur, tel négociateur. Cause probable : pipeline sur un secteur où les prix affichés sont 8% trop hauts."
- **Objectifs adaptatifs** : objectifs personnels des négociateurs calculés à partir de leur historique et du marché, pas imposés arbitrairement.

---

#### 🎯 D2. Coach personnel par négociateur

Pour chaque négociateur, un coach IA :
- Identifie ses forces (ex: "Tu excelles sur les biens > 500k€ avec piscine") et faiblesses ("Taux de transformation faible sur les appartements studio").
- Suggère des formations ciblées (vidéos internes + externes).
- Recommande les biens du pipeline global qui matchent son profil.
- Détecte les signaux de désengagement (moins de connexions, moins d'actions) → alerte manager.

---

#### 🏢 D3. Multi-agences avec consolidation

- Chaque agence a son périmètre, ses KPIs.
- Vue consolidée pour le siège : top biens, top négociateurs cross-agence, biens transférables (un acquéreur agence A cherche dans zone agence B).
- **Matching inter-agences** : un bien en agence B peut être proposé aux acquéreurs agence A avec répartition de commission automatique → fin du cloisonnement.

---

#### 🔍 D4. Registre Hoguet digital et inviolable

Registre des mandats + registre des opérations :
- Numérotation continue par agence (contrainte légale).
- Chaque ligne signée cryptographiquement (chaîne Merkle) → **inviolable**.
- Signature d'un lot quotidien sur blockchain publique (Ethereum ou Polygon, L2) → **preuve d'antériorité opposable** en cas de litige.
- Export PDF signé pour inspection.

> Niveau de conformité jamais vu sur le marché. Argument commercial si vente future du logiciel.

---

#### 💰 D5. Commission engine

Moteur de calcul des commissions multi-niveaux :
- Barème par agence, par négociateur (possibles paliers progressifs : "20% jusqu'à 10k€, 30% au-delà").
- Répartition multi-négociateurs sur un même deal (qui a pris le mandat, qui a vendu).
- Apport d'affaires externe (ambassadeurs, apporteurs tiers) → Club.
- Intégration comptable (export CSV / Pennylane / Axonaut / Cegid).
- Simulation avant deal : "Si je vends à X, je touche Y".

---

### Famille E — Les paris

Idées qui demandent validation mais pourraient être des ruptures.

#### 🕰️ E1. Time machine du bien

Simuler la valeur future du bien : "Dans 5 ans, ce bien vaudra entre X et Y avec 70% de confiance, en se basant sur : travaux ligne 15 à 400m en 2027, école classée A en 2024, projet urbain ZAC à 1km." Argument vendeur / acquéreur investisseur massif.

#### 🎭 E2. Acquéreur fantôme (audit mystère)

Système qui génère de "faux" acquéreurs (via questionnaire réel d'étudiants, ou avec consentement client) et mesure la qualité du service de chaque négociateur : temps de réponse, pertinence des suggestions, pression commerciale perçue. **Autocontrôle qualité** intégré.

#### 🤖 E3. Agent IA autonome sur tâches basses

Pour les tâches répétitives sans valeur humaine ajoutée :
- Relances factures impayées
- Relances diagnostics expirés
- Pré-qualification de leads entrants par chat (horaires de nuit)
- Prise de rdv simples (visite)
L'IA agit, mais avec **"supervision humaine obligatoire"** avant envoi de tout message à un client, et **kill switch** visible.

#### 🌐 E4. API publique + marketplace partenaires

À horizon 18 mois, ouvrir l'API (read-only pour commencer) pour que :
- Notaires lisent directement les dossiers en cours sans aller-retour mail
- Banques pré-étudient les dossiers financement
- Courtiers assurance proposent des offres ciblées aux acquéreurs (avec consentement)
- Apps tierces (déménagement, artisans, décoration) apparaissent dans le portail client → **marketplace partenaires avec commission à la transaction**.

> C'est potentiellement un **deuxième business** : LBI devient plateforme.

#### 🏷️ E5. SaaS white-label

Une fois le produit mature et éprouvé sur LBI, le packager en SaaS pour vendre à d'autres agences indépendantes → **nouveau revenu récurrent**. C'est pour ça que le multi-tenant est obligatoire Phase 0.

---

## 14. Roadmap

### Vue d'ensemble

| Phase | Nom | Durée cible | Livrable |
|---|---|---|---|
| **0** | Fondations monorepo | 2-3 semaines | Monorepo + SSO + 1ère feature migrée |
| **1** | MVP Vendeur | 6-8 semaines | Biens + Mandats + Portail vendeur live |
| **2** | MVP Acquéreur | 6-8 semaines | Contacts + Recherches + Matching + Visites |
| **3** | Cycle complet | 8-10 semaines | Offres → Compromis → Notaire → Acte |
| **4** | Diffusion & acquisition | 4-6 semaines | Multi-diffusion + Site vitrine + Pige |
| **5** | Marketing automation | 4-6 semaines | Séquences + Campagnes + Workflow builder |
| **6** | Intelligence | continue | IA (copilote, estimation, matching sémantique) |
| **7** | Ouverture | 12+ semaines | API publique + SaaS white-label |

### Phase 0 — Fondations (détail)

**Semaine 1**
- [ ] Création repo `lbi-platform` + import `app-lbi` dans `apps/club`
- [ ] Setup pnpm + turborepo + workspaces
- [ ] Extraction `packages/db` (Prisma + migrations)
- [ ] Extraction `packages/auth` (next-auth config)
- [ ] Extraction `packages/ui` (composants mutualisables)
- [ ] CI GitHub Actions (lint, test, build)

**Semaine 2**
- [ ] Init `apps/pro` (Next.js 16 vierge)
- [ ] SSO cookie `.labrieimmobiliere.fr` (local + prod)
- [ ] `packages/events` + Inngest setup
- [ ] `packages/rbac` + Memberships
- [ ] Migration schema DB : ajout `Membership`, refactor `Agency`, ajout RLS
- [ ] Déploiement Vercel : `pro.labrieimmobiliere.fr` (page "Coming soon" sécurisée)

**Semaine 3**
- [ ] Design system thème Pro (tokens)
- [ ] CommandPalette + layout principal Pro
- [ ] Première feature Pro de bout en bout : liste des **Contacts** (lecture des Leads existants via vue)
- [ ] Documentation : `docs/DATA_MODEL.md`, `docs/RBAC.md`, `docs/EVENTS.md` à jour

**Critères de sortie Phase 0**
- ✅ Un utilisateur se connecte sur Club → accède à Pro sans re-login
- ✅ Un lead créé dans Club apparaît dans Pro
- ✅ Pipeline CI vert sur les 2 apps
- ✅ Couverture tests ≥ 40% sur les packages partagés

---

### Phase 1 — MVP Vendeur (détail résumé)

**Livrable utilisable en production par les négociateurs LBI sur les nouveaux mandats.**

- Création fiche bien complète (adresse normalisée, photos R2, plans, DPE, diagnostics)
- Mandat avec génération PDF + signature Yousign
- Registre Hoguet numéroté
- Portail vendeur magic link
- Dashboard vendeur (vues, visites, offres)
- Rédaction annonce IA (A3)
- Photo Studio IA light (A2, uploadable mais pas de home staging encore)

---

### Phase 2+ — (détail dans `docs/ROADMAP.md` après validation Phase 0)

---

## 15. Risques & mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Dérive de scope ("le meilleur logiciel de la planète") | Élevée | Élevé | Roadmap stricte, phases courtes, "non" assumés, document innovations hiérarchisé |
| Sous-estimation complexité Hoguet | Moyenne | Élevé | Conseil d'un avocat spécialisé dès Phase 1, doc conformité tenu à jour |
| Dépendance Vercel / Neon / Prisma | Moyenne | Moyen | Stack standard, exit plan documenté |
| Adoption interne par négociateurs | Moyenne | Élevé | Co-design avec 2 négociateurs pilotes dès Phase 0, onboarding soigné |
| Coûts IA (Claude / OpenAI) explosent | Moyenne | Moyen | Caching agressif, monitoring coût/user, fallback Mistral |
| RGPD / CNIL | Faible | Élevé | Privacy by design, DPO, DPA à jour, doc `COMPLIANCE.md` |
| Concurrent copie rapidement les innovations | Élevée | Faible-Moyen | Carnet Digital du Bien a un effet de réseau qui protège, API publique crée écosystème |
| Burn-out solo dev | Élevée | Élevé | Phases livrables indépendantes, pas de perfectionnisme Phase 1, recruter dev #2 fin Phase 1 ou Phase 2 |

---

## 16. Questions ouvertes à trancher

1. **Nom commercial de l'app Pro** : LBI Pro / LBI Studio / LBI Workspace / autre ?
2. **Hébergement Postgres** : Vercel Postgres (simple, un peu plus cher) vs Neon (flexible, branches DB) vs Supabase (batteries incluses) ?
3. **Yousign vs DocuSign vs Universign** pour signature eIDAS qualifiée ?
4. **Multi-diffusion** : dev intégrations custom ou Ubiflow dès Phase 4 ?
5. **Équipe** : solo dev jusqu'où ? À quel moment recruter un dev #2 ?
6. **Design** : ressource graphique externe pour le design system ou on part du travail existant ?
7. **Pilotage** : une agence pilote pour Phase 1 (Villecresnes only) ou les 2 agences dès le début ?
8. **Budget mensuel infra** acceptable : ~100€/mois (Phase 0) → ~500€/mois (Phase 3) → ~2000€/mois (Phase 6) ?
9. **Ouverture SaaS** (white-label E5) : dans la roadmap dès maintenant ou après 1 an d'usage interne ?
10. **Branding** : le logo et l'identité actuelle sont-ils définitifs ou on revoit avec un designer avant Pro ?

---

## 17. Annexes

### 17.1 Lexique

- **Carte T** : carte professionnelle "Transactions sur immeubles et fonds de commerce" obligatoire pour exercer.
- **Loi Hoguet** : loi n°70-9 du 2 janvier 1970 réglementant les activités immobilières.
- **DVF** : Demandes de Valeurs Foncières, base open data des ventes immobilières.
- **DPE** : Diagnostic de Performance Énergétique.
- **eIDAS** : règlement UE sur l'identification électronique et les services de confiance.
- **RLS** : Row-Level Security (Postgres).
- **RSC** : React Server Components.

### 17.2 Ressources utiles

- [Legifrance — Loi Hoguet](https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006068256/)
- [API Etalab — DVF](https://api.gouv.fr/les-api/api-dvf)
- [Yousign API docs](https://developers.yousign.com/)
- [Geoportail de l'urbanisme](https://www.geoportail-urbanisme.gouv.fr/)
- [Prisma 7 docs](https://www.prisma.io/docs)
- [Next.js 16](https://nextjs.org/docs) (⚠️ lire `node_modules/next/dist/docs/` pour les breaking changes réels)

### 17.3 Inspirations & références produit

- **Attio**, **Linear** : UX dense et rapide pour pros.
- **Pipedrive**, **HubSpot** : pipelines et automation.
- **Gong**, **Chorus** : analyse conversationnelle sales.
- **Rippling**, **Gusto** : workflow builder + permissions.
- **Notion** : flexibilité et polyvalence.
- **Immoweb (BE)**, **Funda (NL)**, **Rightmove (UK)** : portails immobiliers matures.
- **Propertybase**, **Follow Up Boss**, **Chime** : CRM immo US (tous en retard sur FR).
- **Aucun concurrent FR n'offre l'intégration IA + transparence client + carnet du bien qu'on vise.**

---

## 18. Prochaine étape

**Validation de ce document par Alexandre.** Attendus :

1. ✅ ou ❌ sur les décisions A1→A10
2. Réponses aux 10 questions ouvertes (§16)
3. Priorisation personnelle des 30+ innovations listées (§13) : 🔥 = "indispensable Phase 1-3", 👍 = "important", 💤 = "plus tard", ❌ = "non"
4. Choix du nom de l'app Pro

Une fois ces 4 points tranchés → je produis `docs/DATA_MODEL.md` complet + on attaque Phase 0.

---

*Fin du document v0.1.*
