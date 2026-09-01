"use client";

import { useMemo } from "react";
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  type SankeyNodeMinimal,
  type SankeyLinkMinimal,
} from "d3-sankey";
import { teinte } from "@/lib/palette";
import type { Annee, Poste } from "@/lib/types";

type Bande = { id: string; couleur: string; montant: number };
type NoeudMini = SankeyNodeMinimal<Bande, object> & Bande;
type LienMini = SankeyLinkMinimal<Bande, object> & { couleur: string };

const L = 460;
const H = 300;
const MARGE = 10;
/** Au-delà, les rubans deviennent des cheveux : on regroupe la queue. */
const MAX_BANDES = 7;
/** Le gris des « autres », le même que partout ailleurs sur le site. */
const NEUTRE = "#8a8e99";

/**
 * Le diagramme de la page, réduit à sa silhouette, en tête de page.
 *
 * Il ne porte ni étiquette ni chiffre : il montre la forme du mouvement —
 * ce qui entre à gauche, le total au centre, ce qui sort à droite — avant que
 * la personne descende le lire en grand. Les proportions sont celles de
 * l'année affichée, rien n'y est arrangé : les postes trop fins pour être vus
 * sont additionnés dans une dernière bande, jamais supprimés.
 */
export default function FluxMiniature({ donnees }: { donnees: Annee }) {
  const { agregats } = donnees;
  const emprunt = Math.max(0, -agregats.solde);

  const calcule = useMemo(() => {
    const reduire = (postes: Poste[], extra: Bande[] = []): Bande[] => {
      const bandes: Bande[] = postes
        .filter((p) => p.montant > 0)
        .map((p) => ({ id: p.code, couleur: teinte(p.code), montant: p.montant }))
        .concat(extra)
        .sort((a, b) => b.montant - a.montant);
      if (bandes.length <= MAX_BANDES) return bandes;
      const gardees = bandes.slice(0, MAX_BANDES - 1);
      const reste = bandes.slice(MAX_BANDES - 1).reduce((a, b) => a + b.montant, 0);
      return [...gardees, { id: "reste", couleur: NEUTRE, montant: reste }];
    };

    const emplois = donnees.fonctions.length > 0 ? donnees.fonctions : donnees.natures;
    const sources = reduire(
      donnees.recettes,
      emprunt > 0 ? [{ id: "EMPRUNT", couleur: teinte("EMPRUNT"), montant: emprunt }] : [],
    );
    const cibles = reduire(emplois);
    if (!sources.length || !cibles.length) return null;

    const layout = d3Sankey<Bande, object>()
      .nodeId((n) => n.id)
      .nodeWidth(7)
      .nodePadding(5)
      .nodeSort(null)
      .linkSort(null)
      .extent([
        [0, MARGE],
        [L, H - MARGE],
      ]);

    return layout({
      nodes: [
        ...sources.map((b) => ({ ...b, id: `g-${b.id}` })),
        { id: "APU", couleur: teinte("APU"), montant: agregats.depenses },
        ...cibles.map((b) => ({ ...b, id: `d-${b.id}` })),
      ],
      links: [
        ...sources.map((b) => ({
          source: `g-${b.id}`,
          target: "APU",
          value: b.montant,
          couleur: b.couleur,
        })),
        ...cibles.map((b) => ({
          source: "APU",
          target: `d-${b.id}`,
          value: b.montant,
          couleur: b.couleur,
        })),
      ],
    }) as unknown as { nodes: NoeudMini[]; links: LienMini[] };
  }, [donnees, agregats.depenses, emprunt]);

  const chemin = sankeyLinkHorizontal<Bande, object>();
  if (!calcule) return null;

  return (
    <svg
      viewBox={`0 0 ${L} ${H}`}
      className="block h-auto w-full overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Le dessin se découvre de la gauche vers la droite, dans le sens du flux. */}
        <clipPath id="mini-balayage">
          <rect x="0" y="0" width={L} height={H} className="animation-balayage" />
        </clipPath>
      </defs>

      <g clipPath="url(#mini-balayage)">
        {calcule.links.map((l, i) => (
          <path
            key={i}
            d={chemin(l) ?? undefined}
            fill="none"
            stroke={l.couleur}
            strokeWidth={Math.max(1, l.width ?? 1)}
            strokeOpacity={0.5}
          />
        ))}
        {calcule.nodes.map((n) => (
          <rect
            key={n.id}
            x={n.x0 ?? 0}
            y={n.y0 ?? 0}
            width={Math.max((n.x1 ?? 0) - (n.x0 ?? 0), 1)}
            height={Math.max((n.y1 ?? 0) - (n.y0 ?? 0), 1.5)}
            fill={n.couleur}
            rx={2}
          />
        ))}
      </g>
    </svg>
  );
}
