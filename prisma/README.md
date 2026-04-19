# Migrations Prisma — état et procédure de correction

## ⚠️ Problème connu

La migration `20260401185141_init/migration.sql` est écrite en **SQLite**
(types `DATETIME`, `REAL`, `CONSTRAINT … FOREIGN KEY`), alors que
`schema.prisma` et la DB de production sont en **PostgreSQL**.

Elle n'a donc **jamais été appliquée en production** : la base prod a été
créée directement via `prisma db push` (pas via `migrate`).

Conséquences :

- `prisma migrate status` renvoie un état incohérent
- `prisma migrate deploy` sur un nouvel environnement **échouera**
  (les tables ne se créeront pas, types incompatibles)
- Il manque aussi **10 modèles** dans cette migration par rapport au schema
  actuel (`Agency`, `AuditLog`, `Badge`, `Broadcast`, `LeadStatusHistory`,
  `Message`, `Negotiator`, `PushSubscription`, `Review`, `UserDocument`)

## ✅ Procédure de correction (à faire une fois)

Prérequis : la variable `DATABASE_URL` dans `.env` doit pointer vers la
base Postgres de production (ou une base de staging identique).

### Étape 1 — Repartir sur une base propre de migrations

```bash
cd app-lbi

# 1. Archiver / supprimer l'ancienne migration SQLite obsolète
rm -rf prisma/migrations/20260401185141_init
```

### Étape 2 — Générer une nouvelle migration baseline

```bash
# Générer le SQL qui reflète l'état ACTUEL du schema.prisma,
# sans l'exécuter (--create-only).
npx prisma migrate dev --create-only --name baseline_postgres
```

Prisma va créer `prisma/migrations/<timestamp>_baseline_postgres/migration.sql`
avec le DDL PostgreSQL complet pour les 19 modèles.

### Étape 3 — Marquer la migration comme déjà appliquée sur prod

La base prod contient déjà toutes ces tables (via `db push`), il faut juste
lui dire « cette migration est déjà appliquée chez moi » :

```bash
npx prisma migrate resolve --applied <timestamp>_baseline_postgres
```

Vérification :

```bash
npx prisma migrate status
# → "Database schema is up to date!"
```

### Étape 4 — Commit

```bash
git add prisma/migrations
git commit -m "fix: baseline migration PostgreSQL cohérente avec le schema"
git push
```

## 🔮 Pour les prochaines modifications de schéma

À partir de maintenant, **toujours** utiliser le workflow migrations :

```bash
# après avoir modifié schema.prisma
npx prisma migrate dev --name nom_explicite
```

Éviter `prisma db push` en production (court-circuite les migrations et
recrée ce problème).
