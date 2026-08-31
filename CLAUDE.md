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
