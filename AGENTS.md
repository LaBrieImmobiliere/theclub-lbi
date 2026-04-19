<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# App LBI — notes pour agents (humains ou AI)

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript strict
- **Prisma 7** → PostgreSQL (Neon serverless)
- **NextAuth v5-beta** (credentials + magic link)
- **Tailwind v4** + shadcn/ui
- **Vercel** pour le déploiement (cron + cf. `vercel.json`)
- **Sentry** pour le monitoring prod

## Environnements

- **Production** : `https://theclub.labrieimmobiliere.fr`
  - Repo GitHub : `LaBrieImmobiliere/theclub-lbi`
  - Branch déclencheur : `main`
  - DB : Neon `neondb` (via `DATABASE_URL` dans Vercel Env)
- **Dev local** : `http://localhost:3000` (`npm run dev`)
  - ⚠️ Aujourd'hui `DATABASE_URL` dans `.env` pointe directement sur la **DB prod**. Toute migration `prisma migrate dev` touche la production. À séparer (voir ci-dessous).

## Commandes courantes

```bash
npm run dev              # dev server
npm run build            # build prod (= prisma generate && next build)
npm run test:run         # tests vitest une fois
npx tsc --noEmit         # type-check seul
npx eslint app/ components/ lib/
npx prisma migrate dev --name xxx    # créer + appliquer une migration
npx prisma migrate status            # état des migrations vs DB
npx prisma studio --port 5555        # explorer la DB
```

## Workflow migrations (OBLIGATOIRE)

À chaque modification de `prisma/schema.prisma` :

1. `npx prisma migrate dev --name nom_explicite_du_changement`
2. Vérifier le SQL généré dans `prisma/migrations/<timestamp>_<name>/migration.sql`
3. Commit + push → Vercel exécute automatiquement `prisma migrate deploy` dans le `buildCommand` (voir `vercel.json`)

**JAMAIS `prisma db push` en production.** Ça court-circuite les migrations et crée un drift intrackable entre schema et DB (cf. incident baseline du 19 avril 2026, documenté dans `prisma/README.md`).

## Gotchas connus

- **Server Components** (pas de `"use client"`) : `Date.now()`, `new Date()` sont OK. En Client Component, toujours dans un `useEffect` ou memoized.
- **Service Worker** : ne pas cacher le HTML ni les chunks Next.js (hashes changent à chaque deploy → "This page couldn't load"). Le SW actuel (`public/sw.js`) est en mode pass-through minimal.
- **Splash screen** (`app/layout.tsx`) : injecté via JS pur **hors du tree React** pour ne pas causer d'hydration mismatch. Ne pas le remettre en JSX.
- **`<img>` vs `<Image>`** : `<img>` est nécessaire dans le splash (React non encore hydraté) et dans les PDFs/emails. `<Image>` sinon.
- **OneDrive** : si le projet est sous `~/Desktop/` synchro OneDrive, certaines commandes `prisma` peuvent timeout sur des `readFileSync` de `node_modules/effect/`. Recommandé : déplacer vers `~/Code/` ou `~/Projects/` hors sync cloud.
- **Prisma Studio** : fermer les instances en fin de session (`pkill -f "prisma studio"`), elles consomment RAM + peuvent bloquer des locks.

## CI / qualité

- **GitHub Actions** : `.github/workflows/ci.yml` lance tsc + eslint + vitest + next build sur chaque push et PR.
- **Pre-commit hook** (husky) : `npx lint-staged` → eslint --fix sur les fichiers .ts/.tsx staged avant chaque commit.
- **Tests** : `__tests__/api/business-logic.test.ts` (23 tests unit vitest) + `e2e/pages.spec.ts` (Playwright, pages publiques).

## Fichiers importants

- `prisma/schema.prisma` — 19 models, PostgreSQL
- `prisma/README.md` — historique migrations + procédure
- `SECURITY.md` — tracking vulns npm upstream
- `public/sw.js` — service worker (pass-through minimal)
- `app/layout.tsx` — splash screen inline
- `vercel.json` — `buildCommand` avec `migrate deploy`, crons
- `.env` — secrets (pas versionné, cf. `.env.example`)
