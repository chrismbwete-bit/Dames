# 🗄️ Configuration Supabase — Jeux de Dames Africaines Pro

## 1. Créer un projet Supabase

1. Allez sur https://app.supabase.com
2. Cliquez **"New project"**
3. Choisissez un nom (ex: `dames-africaines`)
4. Choisissez une région proche (ex: `West EU`)
5. Définissez un mot de passe pour la base de données

## 2. Configurer le schéma SQL

1. Dans votre projet Supabase → **SQL Editor** → **New Query**
2. Copiez et exécutez le contenu de `src/lib/schema.sql`
3. Cliquez **Run** — toutes les tables seront créées

## 3. Récupérer les clés API

1. Allez dans **Settings** → **API**
2. Copiez:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 4. Variables d'environnement

Créez un fichier `.env` à la racine du projet:

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique
```

## 5. Activer Realtime

Dans Supabase → **Database** → **Replication**:
- Activez les tables: `notifications`, `chat_messages`, `challenges`, `matches`

## 6. Tables créées

| Table | Description |
|-------|-------------|
| `players` | Comptes joueurs (auth, stats, wallet) |
| `matches` | Parties en cours et terminées |
| `transactions` | Dépôts, retraits, gains, pertes |
| `notifications` | Notifications temps réel |
| `challenges` | Défis entre joueurs |
| `chat_messages` | Messages pendant les parties |
| `admin_settings` | Configuration de l'application |

## 7. Sans Supabase (mode offline)

L'application fonctionne **entièrement sans Supabase** en utilisant `localStorage`.
Toutes les données sont persistées localement dans le navigateur.

## 8. Comptes de test (localStorage)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `demo@dames.com` | `demo123` | Joueur |
| `admin@dames.com` | `admin2024` | Admin |
| `kofi@dames.com` | `kofi123` | Joueur |

## 9. Architecture

```
src/
  lib/
    supabase.ts    → Client Supabase + types DB
    database.ts    → Services (Player, Match, Transaction, etc.)
    schema.sql     → Schéma PostgreSQL complet
  store/
    gameStore.ts   → Zustand store intégré avec database.ts
```
