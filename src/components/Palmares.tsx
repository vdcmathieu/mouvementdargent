"use client";

import { useState } from "react";
import type { Rang } from "@/lib/modele";
import { voile } from "@/lib/palette";
import { formater, milliards, pourcent, type Bareme, type Unite } from "@/lib/format";

/**
 * Le même contenu que le diagramme, en liste classée.
 *
 * C'est la vue qui se lit sur un téléphone, qui se parcourt au clavier et qui
 * ne demande aucune interprétation graphique : chaque ligne porte son montant
 * écrit. Le fond coloré de la ligne est proportionnel au plus gros poste de la
 * colonne, jamais au total — sinon tout paraît minuscule.
 */
export default function Palmares({
  titre,
  soustitre,
  rangs,
  bareme,
  unite,
}: {
  titre: string;
  soustitre: string;
  rangs: Rang[];
  bareme: Bareme;
  unite: Unite;
}) {
  const [ouverts, setOuverts] = useState<ReadonlySet<string>>(new Set());
  const maxi = Math.max(...rangs.map((r) => r.montant), 1);
  const total = rangs.reduce((a, r) => a + r.montant, 0);

  const basculer = (code: string) =>
    setOuverts((prec) => {
      const suivant = new Set(prec);
      if (suivant.has(code)) suivant.delete(code);
      else suivant.add(code);
      return suivant;
    });

  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-4 border-b border-encre pb-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.09em]">{titre}</h3>
        <span className="shrink-0 text-[12.5px] tabular-nums text-encre-2">
          {milliards(total)}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-encre-2">{soustitre}</p>

      <ul className="mt-3">
        {rangs.map((r) => {
          const ouvert = ouverts.has(r.code);
          const depliable = r.sous.length > 1;
          return (
            <li key={r.code} className="border-b border-trait last:border-0">
              <Ligne
                libelle={r.libelle}
                couleur={r.couleur}
                montant={r.montant}
                part={r.part}
                largeur={r.montant / maxi}
                bareme={bareme}
                unite={unite}
                depliable={depliable}
                ouvert={ouvert}
                onClick={depliable ? () => basculer(r.code) : undefined}
                titre={r.libelleOfficiel !== r.libelle ? r.libelleOfficiel : undefined}
              />
              {ouvert ? (
                <ul className="mb-2 ml-3 border-l border-trait pl-3">
                  {r.sous.map((s) => (
                    <li key={s.code}>
                      <Ligne
                        libelle={s.libelle}
                        couleur={s.couleur}
                        montant={s.montant}
                        part={s.part}
                        largeur={s.montant / maxi}
                        bareme={bareme}
                        unite={unite}
                        petit
                        titre={s.libelleOfficiel !== s.libelle ? s.libelleOfficiel : undefined}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
              {ouvert && r.note ? (
                <p className="mb-2.5 ml-6 max-w-[52ch] text-[12.5px] leading-relaxed text-encre-2">
                  {r.note}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Ligne({
  libelle,
  couleur,
  montant,
  part,
  largeur,
  bareme,
  unite,
  depliable = false,
  ouvert = false,
  petit = false,
  onClick,
  titre,
}: {
  libelle: string;
  couleur: string;
  montant: number;
  part: number;
  largeur: number;
  bareme: Bareme;
  unite: Unite;
  depliable?: boolean;
  ouvert?: boolean;
  petit?: boolean;
  onClick?: () => void;
  titre?: string;
}) {
  const Balise = onClick ? "button" : "div";
  const secondaire = unite === "part" ? null : pourcent(part);

  return (
    <Balise
      onClick={onClick}
      aria-expanded={depliable ? ouvert : undefined}
      title={titre}
      className={`relative flex w-full items-center gap-3 overflow-hidden rounded-md text-left transition-colors ${
        petit ? "py-1.5 pl-2 pr-2.5" : "py-2.5 pl-2 pr-2.5"
      } ${onClick ? "hover:bg-fond-2" : ""}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0 -z-0 rounded-sm"
        style={{
          width: `${Math.max(largeur * 100, 0.4)}%`,
          background: voile(couleur, petit ? 0.9 : 0.84),
        }}
      />
      <span
        aria-hidden="true"
        className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: couleur }}
      />
      <span
        className={`relative z-10 min-w-0 flex-1 truncate ${
          petit ? "text-[12.5px] text-encre-2" : "text-[13.5px] font-medium"
        }`}
      >
        {libelle}
        {depliable ? (
          <span className="ml-1.5 text-encre-3">{ouvert ? "▾" : "▸"}</span>
        ) : null}
      </span>
      <span className="relative z-10 shrink-0 text-right tabular-nums">
        <span className={petit ? "text-[12.5px] text-encre-2" : "text-[13.5px] font-semibold"}>
          {formater(montant, unite, bareme)}
        </span>
        {secondaire ? (
          <span className="ml-2 hidden text-[11.5px] text-encre-3 sm:inline">{secondaire}</span>
        ) : null}
      </span>
    </Balise>
  );
}
