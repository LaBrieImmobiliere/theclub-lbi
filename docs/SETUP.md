# Setup Vercel Blob + Sentry

Deux services externes doivent être activés côté Vercel pour que l'app soit
pleinement fonctionnelle en production. Ce document décrit les étapes.

---

## 1. Vercel Blob (stockage des uploads)

### Pourquoi
Le filesystem de Vercel est **éphémère** : tout ce qui est écrit dans `public/`
via `fs.writeFileSync` disparaît au prochain cold start ou déploiement. Sans
Vercel Blob, les photos avatars et les documents (RIB, ID) uploadés par les
ambassadeurs **sont perdus silencieusement**.

Le code côté app (`lib/storage.ts`) détecte automatiquement la présence de la
variable `BLOB_READ_WRITE_TOKEN` et utilise Vercel Blob quand elle est
disponible, avec un fallback filesystem pour le dev local.

### Setup (une seule fois)

1. Dashboard Vercel → projet `app-lbi` → onglet **Storage** → `Connect Store`.
2. Choisir **Blob** (stockage objet).
3. Créer un nouveau store (nom libre, ex : `app-lbi-uploads`).
4. Lier le store au projet → Vercel crée automatiquement la variable
   `BLOB_READ_WRITE_TOKEN` dans les env vars de l'app.
5. Redéployer (trigger auto via nouveau commit ou bouton "Redeploy").

### Vérification
- Dashboard Blob : voir un fichier `photos/xxx.jpg` apparaître après upload
  d'une photo depuis le profil ambassadeur.
- L'URL stockée dans `User.image` ou `UserDocument.url` commence par
  `https://<hash>.public.blob.vercel-storage.com/...` au lieu de
  `/photos/...`.

### Coût
- Gratuit jusqu'à 1 Go de stockage + 1 Go de bande passante/mois.
- Au-delà : voir [tarifs Vercel Storage](https://vercel.com/pricing).

---

## 2. Sentry (monitoring d'erreurs prod)

### Pourquoi
Le package `@sentry/nextjs` est installé et les fichiers `sentry.*.config.ts`
sont prêts. Ils ne s'activent que si `NEXT_PUBLIC_SENTRY_DSN` est défini, sinon
ils restent inertes. Sans DSN configuré, **aucune erreur prod n'est remontée** :
un crash iOS Safari chez un ambassadeur reste invisible.

### Setup (une seule fois)

1. Créer un compte Sentry : [sentry.io](https://sentry.io) (plan Developer
   gratuit = 5 000 events/mois, largement suffisant pour The Club).
2. Créer un projet **Next.js** → Sentry fournit un DSN
   (`https://xxx@oyyy.ingest.sentry.io/zzz`).
3. Dashboard Vercel → projet `app-lbi` → Settings → Environment Variables :
   - Clé : `NEXT_PUBLIC_SENTRY_DSN`
   - Valeur : le DSN fourni par Sentry
   - Scope : Production (et Preview si on veut)
4. Redéployer.

### Vérification
- Déclencher une erreur volontaire (ex : route API qui lance `throw new Error("test")`).
- Dashboard Sentry → l'erreur doit apparaître dans Issues sous 1-2 min.
- Le helper `lib/error-logger.ts` envoie aussi à Sentry quand dispo.

### Coût
- Plan Developer : gratuit, 5 000 events / 10k traces, 1 user.
- Plan Team : ~$26/mois si besoin de plus.

---

## 3. Checklist env vars en prod

Vérifier dans Vercel → Settings → Environment Variables que tout est bien là :

- `DATABASE_URL` (Neon Postgres) ✅
- `NEXTAUTH_URL` (`https://theclub.labrieimmobiliere.fr`) ✅
- `NEXTAUTH_SECRET` ✅
- `EMAIL_SERVER_*` (OVH SMTP) ✅
- `EMAIL_FROM` ✅
- `ENCRYPTION_KEY` (chiffrement RIB — 64 chars hex) ✅
- `CRON_SECRET` (jobs Vercel Cron) ✅
- `OVH_SMS_*` (si SMS activé)
- **`BLOB_READ_WRITE_TOKEN`** (à ajouter pour #1 ci-dessus)
- **`NEXT_PUBLIC_SENTRY_DSN`** (à ajouter pour #2 ci-dessus)
