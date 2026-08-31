"use client";

import { useRef, useState } from "react";
import { BarresSolde, CourbesRecettesDepenses, useLargeur } from "./graphiques";
import { milliards, pourcent } from "@/lib/format";
import type { Index } from "@/lib/types";

/**
 * La trajectoire. Un montant isolé ne dit pas grand-chose ; ce qui informe,
 * c'est de voir que l'écart entre ce qui rentre et ce qui sort ne s'est jamais
 * refermé depuis 2015, et que 2020 n'explique pas tout.
 */
export default function Historique({
  index,
  annee,
  onAnnee,
}: {
  index: Index;
  annee: number;
  onAnnee: (a: number) => void;
}) {
  const gauche = useRef<HTMLDivElement>(null);
  const droite = useRef<HTMLDivElement>(null);
  const lg = useLargeur(gauche, 320);
  const ld = useLargeur(droite, 300);
  const [survol, setSurvol] = useState<number | null>(null);

  const points = index.historique;
  const vise = points.find((p) => p.annee === (survol ?? annee)) ?? points[points.length - 1];
  const soldes = points.map((p) => ({ annee: p.annee, part: p.pib ? p.solde / p.pib : 0 }));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.09em]">
            Recettes et dépenses
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-[2px] w-4 rounded-full bg-encre" />
              Dépenses
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-[2px] w-4 rounded-full bg-bleu" />
              Recettes
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="h-3 w-4 rounded-sm"
                style={{ background: "color-mix(in srgb, var(--color-rouge) 13%, transparent)" }}
              />
              Emprunt
            </span>
          </div>
        </div>

        <div ref={gauche} className="mt-3 w-full min-w-0">
          <CourbesRecettesDepenses
            points={points}
            actif={annee}
            survol={survol}
            onSurvol={setSurvol}
            largeur={Math.max(320, lg)}
            hauteur={230}
          />
        </div>

        <dl className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-trait pt-2.5 text-[13px] tabular-nums">
          <div className="flex items-baseline gap-2">
            <dt className="font-semibold">{vise.annee}</dt>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-encre-3">Dépenses</dt>
            <dd className="font-medium">{milliards(vise.depenses)}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-encre-3">Recettes</dt>
            <dd className="font-medium">{milliards(vise.recettes)}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-encre-3">Emprunté</dt>
            <dd className="font-medium text-rouge">{milliards(Math.abs(vise.solde))}</dd>
          </div>
          {vise.annee !== annee ? (
            <button
              onClick={() => onAnnee(vise.annee)}
              className="lien text-[12.5px] text-bleu"
            >
              Voir le détail de {vise.annee}
            </button>
          ) : null}
        </dl>
      </div>

      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.09em]">
          Solde public, en part du PIB
        </h3>
        <div ref={droite} className="mt-3 w-full min-w-0">
          <BarresSolde
            points={soldes}
            actif={annee}
            survol={survol}
            onSurvol={setSurvol}
            largeur={Math.max(280, ld)}
            hauteur={230}
          />
        </div>
        <p className="mt-2 border-t border-trait pt-2.5 text-[13px] leading-relaxed text-encre-2">
          En {vise.annee}, le déficit représente{" "}
          <strong className="font-semibold text-encre tabular-nums">
            {vise.pib ? pourcent(Math.abs(vise.solde) / vise.pib) : "—"}
          </strong>{" "}
          du PIB. Le traité européen fixe une limite de référence à 3 %. Elle n&apos;a été
          respectée que{" "}
          {soldes.filter((s) => Math.abs(s.part) <= 0.03).length} année
          {soldes.filter((s) => Math.abs(s.part) <= 0.03).length > 1 ? "s" : ""} sur{" "}
          {soldes.length} depuis {soldes[0].annee}.
        </p>
      </div>
    </div>
  );
}
