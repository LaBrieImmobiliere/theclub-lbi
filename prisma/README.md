# Migrations Prisma

## État

Une seule migration : `20260419210000_baseline_postgres` — baseline PostgreSQL
complète (19 tables, 404 lignes SQL) générée à partir du `schema.prisma`
actuel, marquée comme déjà appliquée sur la base de production Neon.

`provider = "postgresql"` dans `migration_lock.toml`.

## Pour les prochaines modifications de schéma

Workflow standard :

```bash
# 1. Modifier prisma/schema.prisma
# 2. Générer + appliquer la migration en local (crée le fichier dans prisma/migrations/)
npx prisma migrate dev --name description_du_changement
# 3. Commit + push → Vercel/prod applique automatiquement la migration
#    via "prisma migrate deploy" dans le build.
```

Éviter `prisma db push` en production (court-circuite les migrations).

## Historique — pourquoi ce baseline ?

L'ancienne migration `20260401185141_init` était en **SQLite** (types
`DATETIME`, `REAL`) alors que la DB prod tourne en **PostgreSQL**. Elle
n'avait donc jamais été appliquée. En plus, il manquait 10 modèles
(`Agency`, `AuditLog`, `Badge`, `Broadcast`, `LeadStatusHistory`,
`Message`, `Negotiator`, `PushSubscription`, `Review`, `UserDocument`)
qui avaient été ajoutés au schema puis synchronisés via `prisma db push`
sans générer de migration.

Correctif appliqué le 19 avril 2026 :

1. `rm -rf prisma/migrations/20260401185141_init`
2. `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/20260419210000_baseline_postgres/migration.sql`
3. `migration_lock.toml` : `sqlite` → `postgresql`
4. `npx prisma migrate resolve --applied 20260419210000_baseline_postgres`
5. `npx prisma migrate status` → "Database schema is up to date!"
