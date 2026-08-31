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
- **Ce que l'administration se coûte à elle-même** — le fonctionnement de l'appareil administratif
  pour lui-même, une fois retirés les enseignants, les soignants, les policiers et les militaires.
  Obtenu en croisant la fonction et la nature économique de la dépense, ce qui permet d'écarter à
  la fois la dette, la recherche fondamentale et les transferts qui ne font que transiter par une
  ligne administrative.
- **Les élus, à l'échelle** — la mission « Pouvoirs publics » du budget de l'État et l'indemnité
  parlementaire, remises en regard des deux montants précédents.

Les postes marqués `▸` s'ouvrent d'un clic. Les années 2015 à 2024 sont disponibles.

## Les données

Tout provient de trois tables d'Eurostat, alimentées par l'Insee :

| Table | Contenu |
| --- | --- |
| `gov_10a_main` | Recettes, dépenses et soldes des administrations publiques |
| `gov_10a_taxag` | Détail des impôts et cotisations sociales |
| `gov_10a_exp` | Dépenses par fonction (CFAP/COFOG), deux niveaux, croisées avec la nature économique |
| `nama_10_gdp` | PIB, pour rapporter les montants à la richesse produite |

On passe par Eurostat plutôt que par l'Insee en direct parce que l'API y est stable, complète et
interrogeable automatiquement.
Les chiffres sont les mêmes : c'est l'Insee qui les produit et les transmet.

Les fichiers consolidés sont publiés dans [`public/data/`](public/data) et servis en ligne à des
URL stables — ils sont réutilisables tels quels.

Une seule section échappe à cette source : celle sur les élus.
La comptabilité nationale ne sépare nulle part les élus des agents qu'ils dirigent — la CFAP
s'arrête au groupe 01.1, qui réunit la direction politique, l'administration fiscale et la
diplomatie.
Les montants de la mission « Pouvoirs publics » et de l'indemnité parlementaire sont donc saisis à
la main dans [`src/lib/pouvoirs.ts`](src/lib/pouvoirs.ts), depuis les rapports du Sénat et les
fiches de l'Assemblée nationale, chacun avec son lien et sa date de relevé.
Contrairement au reste du site, ils ne se mettent pas à jour tout seuls.

### Règles de traitement

- Aucun montant n'est estimé, extrapolé ni réparti au prorata.
- Quand la somme des sous-postes ne recouvre pas le total publié, l'écart apparaît dans une ligne
  « Autres » plutôt que d'être dissous dans les autres postes.
- Le déficit est traité comme une ressource à part entière, à gauche du diagramme : sans lui, les
  deux côtés ne s'équilibreraient pas.
- Les périmètres construits, comme « l'administration d'elle-même », montrent ce qu'ils écartent
  au lieu de le retirer en silence, et disent ce que la source ne permet pas de séparer.

Les limites connues — la CSG non isolée, les transferts entre administrations invisibles après
consolidation, l'absence de granularité par ministère — sont détaillées sur la page
[Méthode](src/app/methodologie/page.tsx) du site.

## Développement

Le site est servi sous `vandecatsije.com/mouvementdargent`. Le sous-chemin est piloté par la
variable `NEXT_PUBLIC_BASE_PATH` (vide en local, `/mouvementdargent` en production) : `basePath`
de Next réécrit les routes et les ressources, et `src/lib/chemin.ts` couvre les `fetch` et les liens
de téléchargement, que Next ne préfixe pas.

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
