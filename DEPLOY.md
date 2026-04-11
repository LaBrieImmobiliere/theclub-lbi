# Déploiement The Club LBI — VPS OVH (Ubuntu/Debian)

Ce guide couvre le déploiement manuel complet de l'application Next.js sur un VPS OVH sous Ubuntu/Debian.

---

## 1. Prérequis serveur

Se connecter au VPS en SSH :

```bash
ssh root@VOTRE_IP_VPS
```

### 1.1 Mettre à jour le système

```bash
apt update && apt upgrade -y
```

### 1.2 Installer Node.js 20+ (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # doit afficher v20.x.x ou supérieur
npm -v
```

### 1.3 Installer PM2 (gestionnaire de processus)

```bash
npm install -g pm2
pm2 startup   # suivre les instructions affichées pour démarrer PM2 au boot
```

### 1.4 Installer Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 1.5 Installer Certbot (SSL Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
```

---

## 2. Préparer le répertoire de l'application

```bash
mkdir -p /var/www/theclub/data
```

Le dossier `data/` contiendra la base de données SQLite de production (`prod.db`), séparée du code pour survivre aux déploiements.

---

## 3. Uploader / cloner le code

### Option A — Via Git (recommandé)

Si le projet est hébergé sur GitHub/GitLab :

```bash
cd /var/www/theclub
git clone https://github.com/VOTRE_COMPTE/VOTRE_REPO.git .
```

### Option B — Via rsync depuis votre machine locale

Depuis votre Mac (terminal local, pas le serveur) :

```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude 'dev.db' --exclude '.env*' \
  "/Users/alexandrebrites/Desktop/APP LBI/app-lbi/" \
  root@VOTRE_IP_VPS:/var/www/theclub/
```

### Option C — Via SCP (archive)

```bash
# Sur votre Mac
tar --exclude='node_modules' --exclude='.next' --exclude='dev.db' --exclude='.env*' \
  -czf theclub.tar.gz -C "/Users/alexandrebrites/Desktop/APP LBI/app-lbi" .

scp theclub.tar.gz root@VOTRE_IP_VPS:/var/www/theclub/

# Sur le serveur
cd /var/www/theclub
tar -xzf theclub.tar.gz
rm theclub.tar.gz
```

---

## 4. Configurer les variables d'environnement

Sur le serveur, créer le fichier `.env` à partir du template :

```bash
cd /var/www/theclub
cp .env.example .env
nano .env   # ou vim .env
```

Remplir chaque valeur :

| Variable | Valeur à renseigner |
|---|---|
| `DATABASE_URL` | Laisser `file:/var/www/theclub/data/prod.db` |
| `NEXTAUTH_SECRET` | Générer avec : `openssl rand -hex 32` |
| `NEXTAUTH_URL` | `https://votre-domaine.fr` |
| `EMAIL_SERVER_HOST` | Hôte SMTP OVH (ex. `pro1.mail.ovh.net`) |
| `EMAIL_SERVER_PORT` | `587` |
| `EMAIL_SERVER_USER` | Votre adresse email OVH |
| `EMAIL_SERVER_PASSWORD` | Mot de passe email OVH |
| `EMAIL_FROM` | Adresse expéditeur |
| `ADMIN_EMAIL` | Email du compte administrateur initial |
| `ADMIN_PASSWORD` | Mot de passe administrateur initial |
| `APP_NAME` | Nom affiché de l'application |

Générer un secret sécurisé pour NextAuth :

```bash
openssl rand -hex 32
```

Sécuriser les permissions du fichier `.env` :

```bash
chmod 600 /var/www/theclub/.env
```

---

## 5. Lancer le déploiement

### 5.1 Rendre le script exécutable (une seule fois)

```bash
chmod +x /var/www/theclub/deploy.sh
```

### 5.2 Exécuter le script

```bash
cd /var/www/theclub
./deploy.sh
```

Le script effectue dans l'ordre :
1. `npm ci --omit=dev` — installe les dépendances de production
2. `npx prisma generate` — génère le client Prisma
3. `npx prisma db push` — applique le schéma sur `data/prod.db` sans supprimer les données
4. `npm run build` — compile l'application Next.js
5. `pm2 reload` ou `pm2 start` — démarre/redémarre l'application

En cas d'erreur, le script s'arrête immédiatement (`set -e`). Lire le message d'erreur et corriger avant de relancer.

---

## 6. Configurer Nginx

### 6.1 Copier la configuration

```bash
cp /var/www/theclub/nginx.conf /etc/nginx/sites-available/theclub
```

### 6.2 Remplacer le domaine dans la config

```bash
sed -i 's/VOTRE_DOMAINE.fr/votre-domaine.fr/g' /etc/nginx/sites-available/theclub
```

Ou éditer manuellement et remplacer toutes les occurrences de `VOTRE_DOMAINE.fr` par votre domaine réel.

### 6.3 Activer le site

```bash
ln -s /etc/nginx/sites-available/theclub /etc/nginx/sites-enabled/theclub
# Supprimer le site par défaut si présent
rm -f /etc/nginx/sites-enabled/default
```

### 6.4 Tester la configuration Nginx

```bash
nginx -t
```

Si le test réussit (`syntax is ok` / `test is successful`), ne pas encore recharger — attendre après Certbot.

---

## 7. Obtenir le certificat SSL avec Certbot

Le DNS de votre domaine doit déjà pointer vers l'IP du VPS avant cette étape.

Vérifier que le domaine est bien résolu :

```bash
dig +short votre-domaine.fr
# doit retourner l'IP de votre VPS
```

Obtenir le certificat :

```bash
certbot --nginx -d votre-domaine.fr -d www.votre-domaine.fr
```

Certbot va :
- Vérifier la propriété du domaine
- Télécharger et installer le certificat dans `/etc/letsencrypt/live/votre-domaine.fr/`
- Modifier automatiquement la config Nginx pour pointer vers les bons fichiers SSL

Recharger Nginx après :

```bash
systemctl reload nginx
```

### Renouvellement automatique

Certbot installe un timer systemd automatiquement. Vérifier :

```bash
systemctl status certbot.timer
# ou tester le renouvellement
certbot renew --dry-run
```

---

## 8. Vérification finale

### Vérifier que PM2 tourne

```bash
pm2 status
pm2 logs theclub-lbi --lines 50
```

### Vérifier que Nginx est actif

```bash
systemctl status nginx
```

### Vérifier l'accès HTTP/HTTPS

```bash
curl -I http://votre-domaine.fr    # doit retourner 301 vers HTTPS
curl -I https://votre-domaine.fr   # doit retourner 200
```

### Vérifier la base de données

```bash
ls -lh /var/www/theclub/data/prod.db
# Le fichier doit exister et avoir une taille > 0
```

### Persister PM2 au redémarrage du serveur

```bash
pm2 save
```

---

## Commandes utiles au quotidien

```bash
# Voir les logs en temps réel
pm2 logs theclub-lbi

# Redémarrer l'application
pm2 restart theclub-lbi

# Relancer un déploiement complet
cd /var/www/theclub && ./deploy.sh

# Recharger Nginx après modification de config
nginx -t && systemctl reload nginx

# Statut global
pm2 status && systemctl status nginx
```

---

## Structure des fichiers sur le serveur

```
/var/www/theclub/
├── .env                  # Variables d'environnement (ne jamais versionner)
├── .next/                # Build Next.js (généré par npm run build)
├── data/
│   └── prod.db           # Base de données SQLite de production
├── node_modules/         # Dépendances (générées par npm ci)
├── prisma/
│   └── schema.prisma
├── app/
├── public/
├── ecosystem.config.js   # Config PM2
├── deploy.sh             # Script de déploiement
├── nginx.conf            # Template de config Nginx
└── package.json
```

---

## En cas de problème

| Symptome | Vérification |
|---|---|
| Page 502 Bad Gateway | `pm2 status` — l'app est-elle running ? `pm2 logs theclub-lbi` |
| Erreur de build Next.js | Vérifier que `.env` est complet et correct |
| Prisma : DB non trouvée | Vérifier `DATABASE_URL` dans `.env` et que `data/` existe |
| Certificat SSL expiré | `certbot renew` |
| Nginx ne démarre pas | `nginx -t` pour voir l'erreur de syntaxe |
