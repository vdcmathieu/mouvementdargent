"use client";

import { Miniature } from "./graphiques";
import { euros, milliards, pourcent } from "@/lib/format";
import type { Annee, Index } from "@/lib/types";

/**
 * Les quatre chiffres qu'il faut avoir en tête avant de regarder quoi que ce
 * soit d'autre. Chacun porte sa propre trajectoire : un montant sans son
 * évolution ne dit pas s'il est exceptionnel ou ordinaire.
 */
export default function Reperes({ donnees, index }: { donnees: Annee; index: Index }) {
  const { agregats, meta } = donnees;
  const histo = index.historique;
  const precedent = histo.find((h) => h.annee === meta.annee - 1);
  const deficit = Math.abs(agregats.solde);

  const evolution = (cle: "depenses" | "recettes") =>
    precedent && precedent[cle]
      ? (agregats[cle] - precedent[cle]) / precedent[cle]
      : null;

  const couverture = agregats.recettes / agregats.depenses;
  const parHab = (agregats.depenses * 1e6) / agregats.population;
  const empruntParHab = (deficit * 1e6) / agregats.population;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Carte
        libelle="Dépense publique"
        valeur={milliards(agregats.depenses)}
        detail={
          agregats.partPib
            ? `${pourcent(agregats.partPib)} du produit intérieur brut`
            : "part du PIB non publiée"
        }
        evolution={evolution("depenses")}
        courbe={histo.map((h) => ({ annee: h.annee, valeur: h.depenses }))}
        couleur="var(--color-encre)"
        annee={meta.annee}
      />
      <Carte
        libelle="Recettes"
        valeur={milliards(agregats.recettes)}
        detail={`${pourcent(couverture)} des dépenses sont couvertes`}
        evolution={evolution("recettes")}
        courbe={histo.map((h) => ({ annee: h.annee, valeur: h.recettes }))}
        couleur="var(--color-bleu)"
        annee={meta.annee}
      />
      <Carte
        libelle="Emprunté dans l'année"
        valeur={milliards(deficit)}
        detail={
          agregats.soldePartPib
            ? `${pourcent(Math.abs(agregats.soldePartPib))} du PIB s'ajoutent à la dette`
            : "s'ajoutent à la dette publique"
        }
        courbe={histo.map((h) => ({ annee: h.annee, valeur: -h.solde }))}
        couleur="var(--color-rouge)"
        ton="rouge"
        annee={meta.annee}
      />
      <Carte
        libelle="Par habitant"
        valeur={euros(parHab)}
        detail={`dépensés en ${meta.annee}, dont ${euros(empruntParHab)} empruntés`}
        proportion={1 - couverture}
        annee={meta.annee}
      />
    </div>
  );
}

function Carte({
  libelle,
  valeur,
  detail,
  evolution,
  courbe,
  couleur,
  proportion,
  ton = "neutre",
  annee,
}: {
  libelle: string;
  valeur: string;
  detail: string;
  evolution?: number | null;
  courbe?: { annee: number; valeur: number }[];
  couleur?: string;
  /** Part empruntée, dessinée en barre plutôt qu'en courbe. */
  proportion?: number;
  ton?: "neutre" | "rouge";
  annee: number;
}) {
  return (
    <div className="rounded-carte border border-trait bg-carte px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-encre-3">
          {libelle}
        </div>
        {courbe ? (
          <Miniature points={courbe} couleur={couleur ?? "var(--color-encre)"} actif={annee} />
        ) : null}
      </div>

      <div
        className={`mt-1.5 font-titre text-[1.75rem] leading-none tabular-nums ${
          ton === "rouge" ? "text-rouge" : "text-encre"
        }`}
      >
        {valeur}
      </div>

      {proportion !== undefined ? (
        <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-fond-3">
          <div
            className="bg-bleu"
            style={{ width: `${(1 - proportion) * 100}%` }}
            aria-hidden="true"
          />
          <div className="bg-rouge" style={{ width: `${proportion * 100}%` }} aria-hidden="true" />
        </div>
      ) : null}

      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[12.5px] leading-snug text-encre-2">
        <span>{detail}</span>
        {evolution != null ? (
          <span className="tabular-nums text-encre-3">
            {evolution >= 0 ? "▲" : "▼"} {pourcent(Math.abs(evolution))} sur un an
          </span>
        ) : null}
      </div>
    </div>
  );
}
