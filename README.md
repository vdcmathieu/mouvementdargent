# Mouvement d'argent

D'où vient l'argent public français, et où il va.

Un diagramme de flux interactif construit sur les comptes nationaux des administrations publiques,
produits par l'Insee selon le SEC 2010.
Chaque ruban est un flux d'argent, à l'échelle, et chaque chiffre est traçable jusqu'à sa source.

Le périmètre est celui des **administrations publiques** au sens de la comptabilité nationale :
l'État et ses opérateurs, les collectivités locales, la sécurité sociale.
C'est-à-dire environ **1 673 milliards d'euros** de dépenses en 2024, contre à peu près un tiers de
ce montant pour le seul budget de l'État voté au Parlement.

## Ce que le site montre

- **D'où vient l'argent** — cotisations sociales, impôts sur la consommation, sur le revenu, sur la
  production, sur le capital, ventes et redevances, et la part financée par l'emprunt.
- **À quoi il sert** — la dépense ventilée par fonction (classification CFAP/COFOG), sur deux
  niveaux : de « Protection sociale » à « Vieillesse », de « Santé » à « Hôpital ».
- **Comment il est dépensé** — la même dépense vue par nature économique : prestations versées,
  rémunérations, achats, investissement, intérêts de la dette.

Les postes marqués `▸` s'ouvrent d'un clic. Les années 2015 à 2024 sont disponibles.

## Les données

Tout provient de trois tables d'Eurostat, alimentées par l'Insee :

| Table | Contenu |
| --- | --- |
| `gov_10a_main` | Recettes, dépenses et soldes des administrations publiques |
| `gov_10a_taxag` | Détail des impôts et cotisations sociales |
| `gov_10a_exp` | Dépenses par fonction (CFAP/COFOG), deux niveaux |
| `nama_10_gdp` | PIB, pour rapporter les montants à la richesse produite |

On passe par Eurostat plutôt que par l'Insee en direct parce que l'API y est stable, complète et
interrogeable automatiquement.
Les chiffres sont les mêmes : c'est l'Insee qui les produit et les transmet.

Les fichiers consolidés sont publiés dans [`public/data/`](public/data) et servis en ligne à des
URL stables — ils sont réutilisables tels quels.

### Règles de traitement

- Aucun montant n'est estimé, extrapolé ni réparti au prorata.
- Quand la somme des sous-postes ne recouvre pas le total publié, l'écart apparaît dans une ligne
  « Autres » plutôt que d'être dissous dans les autres postes.
- Le déficit est traité comme une ressource à part entière, à gauche du diagramme : sans lui, les
  deux côtés ne s'équilibreraient pas.

Les limites connues — la CSG non isolée, les transferts entre administrations invisibles après
consolidation, l'absence de granularité par ministère — sont détaillées sur la page
[Méthode](src/app/methodologie/page.tsx) du site.

## Développement

```bash
pnpm install
pnpm run data     # retélécharge et reconstruit public/data/ depuis Eurostat
pnpm dev          # http://localhost:3000
pnpm run apercu   # captures d'écran de contrôle (Playwright)
```

Le script de collecte est [`scripts/build-data.ts`](scripts/build-data.ts).
Il reconstruit l'intégralité des fichiers de données en une commande, sans clé d'API.

## Contribuer

Les corrections factuelles, les formulations trompeuses et les propositions de lecture sont les
bienvenues — [ouvrez une issue](https://github.com/vdcmathieu/mouvementdargent/issues).

Un objectif reste ouvert : descendre au niveau mission / programme / action du budget de l'État,
à partir des données ouvertes du ministère des finances, pour offrir un second étage de détail sous
la vue nationale.

## Licence

Code sous licence MIT.
Les données d'origine relèvent de la licence ouverte d'Eurostat et de l'Insee et restent librement
réutilisables, avec mention de la source.
