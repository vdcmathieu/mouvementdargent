"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  type SankeyNodeMinimal,
  type SankeyLinkMinimal,
} from "d3-sankey";
import { useApparu } from "./Revelation";
import type { Graphe, Noeud } from "@/lib/modele";
import {
  euros,
  formaterCourt,
  milliards,
  parHabitant,
  pourcent,
  type Bareme,
  type Unite,
} from "@/lib/format";

type NoeudCalcule = SankeyNodeMinimal<Noeud, object> & Noeud;
type LienCalcule = SankeyLinkMinimal<Noeud, object> & {
  couleur: string;
  source: NoeudCalcule;
  target: NoeudCalcule;
};

/** Place réservée aux libellés, de part et d'autre des rubans. */
const GOUTTIERE = 268;
const MARGE_V = 22;
const LARGEUR_NOEUD = 13;
const ECART_NOEUDS = 7;
/** En dessous, le diagramme devient illisible : on laisse défiler. */
const LARGEUR_MIN = 980;
/** Hauteur minimale d'un libellé sur deux lignes, plus l'air autour. */
const PAS_LIBELLE = 34;

export default function Sankey({
  graphe,
  bareme,
  unite,
  onBasculer,
}: {
  graphe: Graphe;
  bareme: Bareme;
  unite: Unite;
  onBasculer: (code: string) => void;
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [largeur, setLargeur] = useState(LARGEUR_MIN);
  const [survolId, setSurvolId] = useState<string | null>(null);
  const [curseur, setCurseur] = useState({ x: 0, y: 0 });

  // Le tracé n'a de sens que si on le regarde : on attend que le diagramme
  // entre dans l'écran plutôt que de le dessiner dans le vide.
  const aLEcran = useApparu(conteneur);

  // Il se dessine une fois, de la gauche vers la droite, dans le sens du flux.
  // Ensuite, un changement d'année ou de lecture ne rejoue pas ce balayage —
  // trop long quand on compare deux années de suite : le nouveau tracé se
  // substitue à l'ancien en un fondu court.
  const [grapheRendu, setGrapheRendu] = useState(graphe);
  const [generation, setGeneration] = useState(0);
  if (grapheRendu !== graphe) {
    setGrapheRendu(graphe);
    setGeneration((g) => g + 1);
  }

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setLargeur(Math.max(LARGEUR_MIN, Math.floor(e.contentRect.width))),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nbSources = graphe.noeuds.filter((n) => n.cote === "source").length;
  const nbEmplois = graphe.noeuds.filter((n) => n.cote === "emploi").length;

  // La hauteur suit le côté le plus fourni : chaque nœud doit pouvoir porter
  // son libellé sans écraser ses voisins.
  const hauteur = Math.min(1400, Math.max(600, Math.max(nbSources, nbEmplois) * PAS_LIBELLE + 90));

  const calcule = useMemo(() => {
    const layout = d3Sankey<Noeud, object>()
      .nodeId((n) => n.id)
      .nodeWidth(LARGEUR_NOEUD)
      .nodePadding(ECART_NOEUDS)
      // On garde l'ordre de déclaration — décroissant par montant — plutôt
      // qu'un ordre optimisé pour les croisements : il se lit bien mieux.
      .nodeSort(null)
      .linkSort(null)
      .extent([
        [GOUTTIERE, MARGE_V],
        [largeur - GOUTTIERE, hauteur - MARGE_V],
      ]);

    const g = layout({
      nodes: graphe.noeuds.map((n) => ({ ...n })),
      links: graphe.liens.map((l) => ({
        source: l.source,
        target: l.cible,
        value: Math.max(l.valeur, 1),
        couleur: l.couleur,
      })),
    }) as unknown as { nodes: NoeudCalcule[]; links: LienCalcule[] };

    // Les libellés ne peuvent pas suivre exactement des rubans parfois épais
    // d'un pixel : on les écarte verticalement, et un trait de rappel relie
    // l'étiquette à son nœud quand elle a dû bouger.
    const etiquettes = new Map<string, number>();
    for (const cote of ["source", "emploi"] as const) {
      const liste = g.nodes
        .filter((n) => n.cote === cote)
        .map((n) => ({ id: n.id, y: ((n.y0 ?? 0) + (n.y1 ?? 0)) / 2 }))
        .sort((a, b) => a.y - b.y);
      // Descente : personne ne chevauche son prédécesseur.
      for (let i = 1; i < liste.length; i++) {
        liste[i].y = Math.max(liste[i].y, liste[i - 1].y + PAS_LIBELLE);
      }
      // Remontée : on recolle au bas du cadre sans déborder.
      let plafond = hauteur - MARGE_V - 10;
      for (let i = liste.length - 1; i >= 0; i--) {
        liste[i].y = Math.min(liste[i].y, plafond);
        plafond = liste[i].y - PAS_LIBELLE;
      }
      for (const l of liste) etiquettes.set(l.id, l.y);
    }

    return { ...g, etiquettes };
  }, [graphe, largeur, hauteur]);

  const chemin = sankeyLinkHorizontal<Noeud, object>();

  // Au premier tracé, le balayage ; ensuite, un simple fondu sur le nouveau
  // graphe. Les deux groupes portent les mêmes attributs.
  const trace = {
    clipPath: "url(#balayage-flux)",
    className: generation === 0 ? undefined : "animation-fondu",
  };

  // On ne retient que l'identifiant du nœud survolé, jamais l'objet : après un
  // changement d'année ou de mode, l'infobulle se recalcule sur le graphe
  // courant au lieu d'afficher des montants périmés.
  const survol = calcule.nodes.find((n) => n.id === survolId) ?? null;

  const enAvant = (n: NoeudCalcule) => survolId === null || survolId === n.id || n.id === "APU";
  const opacite = (n: NoeudCalcule) => (enAvant(n) ? 1 : 0.5);
  /** Le texte s'estompe moins que le ruban : une étiquette doit rester lisible. */
  const opaciteTexte = (n: NoeudCalcule) => (enAvant(n) ? 1 : 0.62);
  const lienActif = (l: LienCalcule) =>
    survolId === null || l.source.id === survolId || l.target.id === survolId;

  return (
    <div className="relative w-full">
      <div ref={conteneur} className="w-full overflow-x-auto overflow-y-hidden">
        <svg
          width={largeur}
          height={hauteur}
          viewBox={`0 0 ${largeur} ${hauteur}`}
          className="block select-none"
          role="img"
          aria-label="Diagramme de flux des recettes et des dépenses publiques"
          onMouseLeave={() => setSurvolId(null)}
        >
          <defs>
            <clipPath id="balayage-flux">
              <rect
                x="0"
                y="0"
                width={largeur}
                height={hauteur}
                className={
                  generation !== 0
                    ? undefined
                    : aLEcran
                      ? "animation-balayage"
                      : "attente-balayage"
                }
              />
            </clipPath>
          </defs>

          <g key={`liens-${generation}`} {...trace}>
            {calcule.links.map((l, i) => (
              <path
                key={i}
                d={chemin(l) ?? undefined}
                fill="none"
                stroke={l.couleur}
                strokeWidth={Math.max(1, l.width ?? 1)}
                strokeOpacity={survolId === null ? 0.58 : lienActif(l) ? 0.78 : 0.16}
                className="transition-[stroke-opacity] duration-200"
              />
            ))}
          </g>

          <g key={`noeuds-${generation}`} {...trace}>
            {calcule.nodes.map((n) => {
              const x0 = n.x0 ?? 0;
              const x1 = n.x1 ?? 0;
              const y0 = n.y0 ?? 0;
              const y1 = n.y1 ?? 0;
              const yNoeud = (y0 + y1) / 2;
              const tronc = n.cote === "tronc";
              const aGauche = n.cote === "source";
              const cliquable = n.depliable || n.deplie;
              const yLibelle = calcule.etiquettes.get(n.id) ?? yNoeud;
              const decale = Math.abs(yLibelle - yNoeud) > 3;
              const xAncre = aGauche ? x0 - 13 : x1 + 13;

              return (
                <g
                  key={n.id}
                  className={cliquable ? "cursor-pointer" : "cursor-default"}
                  onMouseMove={(e) => {
                    setSurvolId(n.id);
                    const r = conteneur.current?.getBoundingClientRect();
                    if (r) setCurseur({ x: e.clientX - r.left, y: e.clientY - r.top });
                  }}
                  onClick={() => cliquable && onBasculer(n.parent)}
                  tabIndex={cliquable ? 0 : -1}
                  onFocus={() => setSurvolId(n.id)}
                  onBlur={() => setSurvolId(null)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && cliquable) {
                      e.preventDefault();
                      onBasculer(n.parent);
                    }
                  }}
                  role={cliquable ? "button" : undefined}
                  aria-label={`${n.libelle}, ${milliards(n.montant)}${
                    cliquable ? (n.deplie ? ", replier" : ", ouvrir le détail") : ""
                  }`}
                >
                  <rect
                    x={x0}
                    y={y0}
                    width={Math.max(x1 - x0, 1)}
                    height={Math.max(y1 - y0, 1.5)}
                    fill={n.couleur}
                    rx={2}
                    opacity={opacite(n)}
                    className="transition-opacity duration-150"
                  />

                  {tronc ? (
                    <text
                      x={(x0 + x1) / 2}
                      y={yNoeud}
                      textAnchor="middle"
                      className="pointer-events-none fill-fond text-[11px] font-medium tracking-wide tabular-nums"
                      style={{ writingMode: "vertical-rl" }}
                    >
                      {milliards(n.montant)}
                    </text>
                  ) : (
                    <>
                      {decale ? (
                        <path
                          d={`M${xAncre + (aGauche ? 8 : -8)},${yNoeud} L${xAncre + (aGauche ? 2 : -2)},${yLibelle}`}
                          stroke={n.couleur}
                          strokeWidth={1.25}
                          fill="none"
                          opacity={opacite(n) * 0.85}
                        />
                      ) : null}
                      <Etiquette
                        noeud={n}
                        x={xAncre}
                        y={yLibelle}
                        ancrage={aGauche ? "end" : "start"}
                        opacite={opaciteTexte(n)}
                        bareme={bareme}
                        unite={unite}
                        actif={survolId === n.id}
                      />
                    </>
                  )}

                  {/* Zone de survol confortable, même pour un ruban d'un pixel. */}
                  <rect
                    x={aGauche ? xAncre - 244 : x0}
                    y={Math.min(y0, yLibelle - 15)}
                    width={244 + (x1 - x0)}
                    height={Math.max(y1, yLibelle + 15) - Math.min(y0, yLibelle - 15)}
                    fill="transparent"
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Sur petit écran le diagramme déborde : on signale qu'il continue. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-fond to-transparent lg:hidden" />

      {survol && survol.cote !== "tronc" ? (
        <Infobulle
          noeud={survol}
          position={curseur}
          bareme={bareme}
          largeur={largeur}
          hauteur={hauteur}
        />
      ) : null}
    </div>
  );
}

function Etiquette({
  noeud,
  x,
  y,
  ancrage,
  opacite,
  bareme,
  unite,
  actif,
}: {
  noeud: NoeudCalcule;
  x: number;
  y: number;
  ancrage: "start" | "end";
  opacite: number;
  bareme: Bareme;
  unite: Unite;
  actif: boolean;
}) {
  const libelle =
    noeud.libelle.length > 40 ? `${noeud.libelle.slice(0, 39).trimEnd()}…` : noeud.libelle;
  return (
    <text
      x={x}
      y={y}
      textAnchor={ancrage}
      opacity={opacite}
      className="pointer-events-none transition-opacity duration-150"
    >
      <tspan
        className={`text-[12.5px] ${actif ? "fill-encre font-semibold" : "fill-encre font-medium"}`}
        dy="-0.22em"
      >
        {libelle}
        {noeud.depliable ? " ▸" : ""}
      </tspan>
      <tspan x={x} dy="1.32em" className="fill-encre-2 text-[11px] tabular-nums">
        {formaterCourt(noeud.montant, unite, bareme)}
      </tspan>
    </text>
  );
}

function Infobulle({
  noeud,
  position,
  bareme,
  largeur,
  hauteur,
}: {
  noeud: NoeudCalcule;
  position: { x: number; y: number };
  bareme: Bareme;
  largeur: number;
  hauteur: number;
}) {
  const aDroite = position.x > largeur / 2;
  return (
    <div
      className="pointer-events-none absolute z-20 w-[292px] rounded-xl border border-trait bg-carte p-3.5 shadow-[0_10px_34px_rgba(28,32,39,0.16)]"
      style={{
        left: aDroite ? undefined : position.x + 18,
        right: aDroite ? largeur - position.x + 18 : undefined,
        top: Math.min(Math.max(4, position.y - 40), hauteur - 190),
      }}
    >
      <div className="text-[13.5px] font-semibold leading-snug">{noeud.libelle}</div>
      {noeud.libelleOfficiel && noeud.libelleOfficiel !== noeud.libelle ? (
        <div className="mt-0.5 text-[11.5px] italic leading-snug text-encre-3">
          {noeud.libelleOfficiel}
        </div>
      ) : null}

      <div className="mt-2 font-titre text-[1.35rem] leading-none tabular-nums">
        {milliards(noeud.montant)}
      </div>

      {/* Les quatre lectures d'un même montant, d'un coup. */}
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px] tabular-nums">
        <dt className="text-encre-3">Part du total</dt>
        <dd className="text-right font-medium">{pourcent(noeud.part)}</dd>
        <dt className="text-encre-3">Par habitant</dt>
        <dd className="text-right font-medium">{parHabitant(noeud.montant, bareme.population)}</dd>
        <dt className="text-encre-3">Pour 1 000 € dépensés</dt>
        <dd className="text-right font-medium">
          {euros((noeud.montant / bareme.total) * 1000)}
        </dd>
      </dl>

      {noeud.note ? (
        <p className="mt-2.5 border-t border-trait pt-2 text-[12.5px] leading-relaxed text-encre-2">
          {noeud.note}
        </p>
      ) : null}
      {noeud.depliable ? (
        <p className="mt-2 text-[12px] font-semibold text-bleu">Cliquer pour voir le détail</p>
      ) : noeud.deplie ? (
        <p className="mt-2 text-[12px] font-semibold text-bleu">Cliquer pour replier</p>
      ) : null}
    </div>
  );
}
