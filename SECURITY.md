# Security — suivi des vulnérabilités npm

Re-check toutes les 2-4 semaines avec `npm audit` pour voir quelles vulns
ont été patchées upstream.

## État actuel (19 avril 2026)

**Total : 7 vulnérabilités** (0 critical, 0 high, 4 moderate, 3 low)

Aucune n'est exploitable directement dans le code de l'app — toutes sont
dans des **dépendances transitives** que nous ne contrôlons pas
directement. Les patches doivent venir des mainteneurs upstream.

### En attente de patch upstream

| Package | Sévérité | Via | CVE / Advisory |
|---|---|---|---|
| `nodemailer` | moderate | `@auth/core` → `next-auth` | [GHSA-c7w3-x93f-qmm8](https://github.com/advisories/GHSA-c7w3-x93f-qmm8), [GHSA-vvjj-xcjg-gr5g](https://github.com/advisories/GHSA-vvjj-xcjg-gr5g) — SMTP command injection |
| `@hono/node-server` | moderate | `@vercel/blob` | [GHSA-92pp-h63x-v22m](https://github.com/advisories/GHSA-92pp-h63x-v22m) — middleware bypass |
| `passport` | moderate | `next-auth` | [GHSA-v923-w3x8-wh69](https://github.com/advisories/GHSA-v923-w3x8-wh69) — session regen |
| `dompurify` | low × 3 | diverses | XSS mitigation bypass |

### Tentatives passées

- **19 avril 2026** : `npm audit fix --force` rejeté. Aurait downgradé
  `next-auth` v5 → v4.24.14 et introduit **14 vulns au lieu de 7**
  (5 critical + 5 high). Revert immédiat.
- **19 avril 2026** : `npm audit fix` (non-force) appliqué → 3 low fixées.
  Upgrade manuel `next 16.2.1 → 16.2.4` → DoS Server Components fixé.
  Auparavant 11 vulns, aujourd'hui 7.

### Procédure de re-check

```bash
cd app-lbi
npm audit --json | node -e "let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{const j=JSON.parse(d); console.log(j.metadata?.vulnerabilities)});"
```

Si le nombre baisse sans breaking change, tenter `npm audit fix` (sans
--force). Si un patch upstream est dispo pour nodemailer ou @hono, mettre
à jour le package parent (`next-auth`, `@vercel/blob`).

**Ne jamais** relancer `npm audit fix --force` sur ce projet : il downgrade
toute la chaîne auth à une version obsolète cassée.
