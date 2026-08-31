# Mouvement d'argent

Diagramme de flux interactif des finances publiques françaises. Next.js (App Router), TypeScript,
Tailwind v4, d3-sankey. Tout est statique : aucune base de données, aucun appel réseau à l'exécution.

## Structure

- `scripts/build-data.ts` — télécharge Eurostat et écrit `public/data/apu-<année>.json` + `index.json`.
  C'est la seule source de vérité des chiffres. Lancer avec `pnpm run data`.
- `src/lib/modele.ts` — transforme les données d'une année en nœuds et liens pour le Sankey.
- `src/components/Sankey.tsx` — rendu SVG, placement des étiquettes, interactions.
- `src/app/methodologie/page.tsx` — doit rester à jour avec toute évolution du traitement.

## Règles

- L'interface est en français, y compris les identifiants, les commentaires et les noms de variables.
- Aucun chiffre inventé, estimé ou réparti au prorata. Un écart non expliqué se publie dans une
  ligne « Autres », il ne se dissout pas.
- Toute nouvelle transformation des données se documente sur la page Méthode dans le même commit.
- Les libellés raccourcis pour l'affichage vivent dans `src/lib/libelles.ts` ; le libellé officiel
  reste dans les données publiées et s'affiche dans l'infobulle.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
