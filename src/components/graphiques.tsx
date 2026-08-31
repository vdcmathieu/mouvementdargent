"use client";

import { useEffect, useId, useState } from "react";
import { line as d3Line, area as d3Area, curveMonotoneX } from "d3-shape";
import { scaleLinear } from "d3-scale";

export type Point = { annee: number; valeur: number };

/**
 * Courbe minuscule, sans axe ni étiquette : elle ne sert qu'à dire « ça monte,
 * ça descend, ça a décroché en 2020 ». Le chiffre exact est à côté, et la
 * courbe complète est plus bas dans la page.
 */
export function Miniature({
  points,
  couleur,
  actif,
  largeur = 108,
  hauteur = 30,
}: {
  points: Point[];
  couleur: string;
  /** L'année sélectionnée, marquée d'un point. */
  actif: number;
  largeur?: number;
  hauteur?: number;
}) {
  if (points.length < 2) return null;
  const m = 4;
  const x = scaleLinear()
    .domain([points[0].annee, points[points.length - 1].annee])
    .range([m, largeur - m]);
  const vals = points.map((p) => p.valeur);
  const y = scaleLinear()
    .domain([Math.min(...vals), Math.max(...vals)])
    .range([hauteur - m, m]);

  const trace = d3Line<Point>()
    .x((p) => x(p.annee))
    .y((p) => y(p.valeur))
    .curve(curveMonotoneX)(points);

  const courant = points.find((p) => p.annee === actif) ?? points[points.length - 1];

  return (
    <svg width={largeur} height={hauteur} viewBox={`0 0 ${largeur} ${hauteur}`} aria-hidden="true">
      <path d={trace ?? undefined} fill="none" stroke={couleur} strokeWidth={2} opacity={0.45} />
      <circle cx={x(courant.annee)} cy={y(courant.valeur)} r={3} fill={couleur} />
    </svg>
  );
}

/**
 * Deux séries et l'écart entre elles. Un seul axe : les deux mesures sont dans
 * la même unité, il n'y a donc aucune raison d'en inventer un second.
 */
export function CourbesRecettesDepenses({
  points,
  actif,
  survol,
  onSurvol,
  largeur,
  hauteur,
}: {
  points: { annee: number; recettes: number; depenses: number }[];
  actif: number;
  survol: number | null;
  onSurvol: (a: number | null) => void;
  largeur: number;
  hauteur: number;
}) {
  const id = useId();
  const marge = { haut: 14, bas: 26, gauche: 52, droite: 12 };
  const x = scaleLinear()
    .domain([points[0].annee, points[points.length - 1].annee])
    .range([marge.gauche, largeur - marge.droite]);
  const maxi = Math.max(...points.map((p) => p.depenses)) / 1000;
  const mini = Math.min(...points.map((p) => p.recettes)) / 1000;
  const y = scaleLinear()
    .domain([mini - (maxi - mini) * 0.35, maxi + (maxi - mini) * 0.12])
    .range([hauteur - marge.bas, marge.haut])
    .nice();

  const md = (v: number) => v / 1000;
  const ligne = (cle: "recettes" | "depenses") =>
    d3Line<(typeof points)[number]>()
      .x((p) => x(p.annee))
      .y((p) => y(md(p[cle])))
      .curve(curveMonotoneX)(points);

  const ecart = d3Area<(typeof points)[number]>()
    .x((p) => x(p.annee))
    .y0((p) => y(md(p.recettes)))
    .y1((p) => y(md(p.depenses)))
    .curve(curveMonotoneX)(points);

  const graduations = y.ticks(4);
  const vise = survol ?? actif;
  const pointVise = points.find((p) => p.annee === vise);

  return (
    <svg
      width={largeur}
      height={hauteur}
      viewBox={`0 0 ${largeur} ${hauteur}`}
      className="block max-w-full"
      role="img"
      aria-label="Recettes et dépenses publiques année par année, en milliards d'euros"
      onMouseLeave={() => onSurvol(null)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * largeur;
        const annee = Math.round(x.invert(px));
        const borne = Math.min(
          Math.max(annee, points[0].annee),
          points[points.length - 1].annee,
        );
        onSurvol(borne);
      }}
    >
      {graduations.map((g) => (
        <g key={g}>
          <line
            x1={marge.gauche}
            x2={largeur - marge.droite}
            y1={y(g)}
            y2={y(g)}
            stroke="var(--color-trait)"
            strokeWidth={1}
          />
          <text
            x={marge.gauche - 8}
            y={y(g)}
            textAnchor="end"
            dominantBaseline="middle"
            className="fill-encre-3 text-[10.5px] tabular-nums"
          >
            {g.toLocaleString("fr-FR")}
          </text>
        </g>
      ))}

      <path d={ecart ?? undefined} fill="var(--color-rouge)" opacity={0.13} />
      <path
        d={ligne("depenses") ?? undefined}
        fill="none"
        stroke="var(--color-encre)"
        strokeWidth={2}
      />
      <path
        d={ligne("recettes") ?? undefined}
        fill="none"
        stroke="var(--color-bleu)"
        strokeWidth={2}
      />

      {points.map((p) => (
        <text
          key={p.annee}
          x={x(p.annee)}
          y={hauteur - 8}
          textAnchor="middle"
          className={`text-[10.5px] tabular-nums ${
            p.annee === vise ? "fill-encre font-semibold" : "fill-encre-3"
          }`}
        >
          {largeur < 560 && p.annee % 2 === 1 ? "" : String(p.annee).slice(2)}
        </text>
      ))}

      {pointVise ? (
        <g key={id}>
          <line
            x1={x(pointVise.annee)}
            x2={x(pointVise.annee)}
            y1={marge.haut}
            y2={hauteur - marge.bas}
            stroke="var(--color-encre)"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <circle
            cx={x(pointVise.annee)}
            cy={y(md(pointVise.depenses))}
            r={4.5}
            fill="var(--color-encre)"
            stroke="var(--color-fond)"
            strokeWidth={2}
          />
          <circle
            cx={x(pointVise.annee)}
            cy={y(md(pointVise.recettes))}
            r={4.5}
            fill="var(--color-bleu)"
            stroke="var(--color-fond)"
            strokeWidth={2}
          />
        </g>
      ) : null}
    </svg>
  );
}

/** Le solde, année par année, en part du PIB. Une seule série, un seul axe. */
export function BarresSolde({
  points,
  actif,
  survol,
  onSurvol,
  largeur,
  hauteur,
}: {
  points: { annee: number; part: number }[];
  actif: number;
  survol: number | null;
  onSurvol: (a: number | null) => void;
  largeur: number;
  hauteur: number;
}) {
  const marge = { haut: 12, bas: 24, gauche: 40, droite: 10 };
  const pas = (largeur - marge.gauche - marge.droite) / points.length;
  const largeurBarre = Math.min(26, pas - 6);
  const pire = Math.min(...points.map((p) => p.part));
  const y = scaleLinear()
    .domain([pire * 1.12, 0])
    .range([hauteur - marge.bas, marge.haut]);
  const vise = survol ?? actif;

  return (
    <svg
      width={largeur}
      height={hauteur}
      viewBox={`0 0 ${largeur} ${hauteur}`}
      className="block max-w-full"
      role="img"
      aria-label="Solde public en part du PIB, année par année"
      onMouseLeave={() => onSurvol(null)}
    >
      <line
        x1={marge.gauche}
        x2={largeur - marge.droite}
        y1={y(0)}
        y2={y(0)}
        stroke="var(--color-trait-2)"
        strokeWidth={1}
      />
      {y.ticks(3).map((g) => (
        <text
          key={g}
          x={marge.gauche - 7}
          y={y(g)}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-encre-3 text-[10.5px] tabular-nums"
        >
          {(g * 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %
        </text>
      ))}
      {points.map((p, i) => {
        const cx = marge.gauche + pas * (i + 0.5);
        const en = p.annee === vise;
        return (
          <g key={p.annee} onMouseEnter={() => onSurvol(p.annee)}>
            <rect
              x={cx - pas / 2}
              y={marge.haut}
              width={pas}
              height={hauteur - marge.haut - marge.bas}
              fill="transparent"
            />
            <rect
              x={cx - largeurBarre / 2}
              y={y(0)}
              width={largeurBarre}
              height={Math.max(1, y(p.part) - y(0))}
              fill="var(--color-rouge)"
              opacity={en ? 1 : 0.62}
              rx={0}
              className="transition-opacity"
            />
            <text
              x={cx}
              y={hauteur - 7}
              textAnchor="middle"
              className={`text-[10.5px] tabular-nums ${en ? "fill-encre font-semibold" : "fill-encre-3"}`}
            >
              {largeur < 560 && p.annee % 2 === 1 ? "" : String(p.annee).slice(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Mesure la largeur disponible pour un graphique fluide. */
export function useLargeur(ref: React.RefObject<HTMLElement | null>, defaut: number) {
  const [largeur, setLargeur] = useState(defaut);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setLargeur(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return largeur;
}
