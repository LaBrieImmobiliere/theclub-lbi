#!/bin/bash
# NOTE: Rendre ce script exécutable sur le serveur avec : chmod +x deploy.sh
# Ne pas exécuter chmod localement - cette commande est à lancer sur le VPS uniquement.
set -e

APP_DIR="/var/www/theclub"
DATA_DIR="$APP_DIR/data"

echo "=== Déploiement The Club LBI ==="

# Aller dans le répertoire de l'app
cd "$APP_DIR"

# Installer les dépendances (sans devDependencies)
echo "→ Installation des dépendances..."
npm ci --omit=dev

# Générer le client Prisma
echo "→ Génération du client Prisma..."
npx prisma generate

# Appliquer les migrations de schéma (sans réinitialiser les données)
echo "→ Application du schéma DB..."
mkdir -p "$DATA_DIR"
npx prisma db push --accept-data-loss=false

# Build Next.js
echo "→ Build Next.js..."
npm run build

# Redémarrer PM2
echo "→ Redémarrage PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "✓ Déploiement terminé !"
pm2 status
