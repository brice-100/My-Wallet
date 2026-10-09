# AGENTS.md — Directives & Conventions de Développement

## Projet : Portefeuille Numérique PFM (SaaS Africain)
Date : 8 Octobre 2026
Stack : React 19 + TypeScript + Vite + Tailwind CSS v4 + Supabase + TanStack Query + Recharts

## 1. Règles d'Architecture Obligatoires
- **Pas d'appels Supabase directs dans les composants UI** :
  Toujours passer par la couche d'accès aux données `src/data/` (`wallets.ts`, `transactions.ts`, `budgets.ts`, etc.).
- **Calculs Financiers en Fonctions Pures** :
  Toute logique arithmétique (solde, agrégation, prorata reste à vivre, pourcentage budgétaire) doit résider dans `src/kpi/` sans dépendance réseau ou DOM.
- **Gestion des Montants** :
  Les montants sont stockés en entiers (`bigint` en SQL, `number` arrondi ou `bigint` en TS, représentant les francs CFA : 1 = 1 FCFA). Jamais de nombres à virgule flottante stockés en base.
- **Suppression Logique** :
  Utiliser systématiquement `deleted_at = now()` plutôt qu'un `DELETE` SQL pour préserver l'historique et permettre la future synchronisation offline.
- **Génération des IDs** :
  Utiliser `crypto.randomUUID()` côté client pour les insertions afin de garantir l'idempotence et la compatibilité offline future.

## 2. Commandes du Projet
- Dev server : `npm run dev` (depuis `pfm-app`)
- Build : `npm run build`
- Lint : `npm run lint`

## 3. Conventions de Style & UX
- Design moderne adapté au mobile et desktop (Mobile-First responsive, glassmorphism sobre, palette africaine moderne : vert émeraude `#059669`, or chaleureux `#D97706`, bleu nuit `#0F172A`).
- Support natif des devises de la zone franc et limitrophes (`FCFA (XOF/XAF)`, `GNF`, `CDF`, `EUR`, `USD`).
