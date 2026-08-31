"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Sankey from "./Sankey";
import Chiffre from "./Chiffre";
import { construireGraphe } from "@/lib/modele";
import { euros, milliards, parHabitant, pourcent } from "@/lib/format";
import type { Annee, Index, Mode } from "@/lib/types";
import { chemin } from "@/lib/chemin";

export default function Explorateur({
  initiale,
  index,
}: {
  initiale: Annee;
  index: Index;
}) {
  const [donnees, setDonnees] = useState(initiale);
  const [mode, setMode] = useState<Mode>("fonction");
  const [deplies, setDeplies] = useState<ReadonlySet<string>>(new Set());
  const [chargement, demarrer] = useTransition();

  const changerAnnee = useCallback(
    async (annee: number) => {
      if (annee === donnees.meta.annee) return;
      const res = await fetch(chemin(`/data/apu-${annee}.json`));
      const suivante = (await res.json()) as Annee;
      demarrer(() => {
        setDonnees(suivante);
        setDeplies(new Set());
      });
    },
    [donnees.meta.annee],
  );

  const basculer = useCallback((code: string) => {
    setDeplies((prec) => {
      const suivant = new Set(prec);
      if (suivant.has(code)) suivant.delete(code);
      else suivant.add(code);
      return suivant;
    });
  }, []);

  const graphe = useMemo(
    () => construireGraphe(donnees, mode, deplies),
    [donnees, mode, deplies],
  );

  const { agregats, meta } = donnees;
  const pop = agregats.population;

  // Ce que coûte le fonctionnement de l'appareil public lui-même.
  const nature = (code: string) => donnees.natures.find((n) => n.code === code)?.montant ?? 0;
  const fonctionnement = nature("SALAIRES") + nature("FONCTIONNEMENT");
  const redistribution = nature("PRESTA_ESPECES") + nature("PRESTA_NATURE");
  const interets = nature("INTERETS");

  const anneesCompletes = new Set(index.anneesCompletes);

  return (
    <>
      <div className="border-b border-trait bg-paper-2">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-5 gap-y-6 px-6 py-7 sm:grid-cols-4 sm:gap-x-7">
          <Chiffre
            libelle="Recettes"
            valeur={milliards(agregats.recettes)}
            detail={`${parHabitant(agregats.recettes, pop)} par habitant`}
          />
          <Chiffre
            libelle="Dépenses"
            valeur={milliards(agregats.depenses)}
            detail={
              agregats.partPib
                ? `${pourcent(agregats.partPib)} du PIB`
                : `${parHabitant(agregats.depenses, pop)} par habitant`
            }
          />
          <Chiffre
            libelle="Déficit"
            valeur={milliards(Math.abs(agregats.solde))}
            detail={
              agregats.soldePartPib
                ? `${pourcent(Math.abs(agregats.soldePartPib))} du PIB`
                : undefined
            }
            ton="rouge"
          />
          <Chiffre
            libelle="Soit par habitant"
            valeur={`${euros((agregats.depenses * 1e6) / pop)}`}
            detail="de dépense publique par personne"
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] px-6">
        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex w-full rounded-full border border-trait bg-paper-2 p-1 sm:w-auto">
            <Onglet actif={mode === "fonction"} onClick={() => setMode("fonction")}>
              À quoi ça sert
            </Onglet>
            <Onglet actif={mode === "nature"} onClick={() => setMode("nature")}>
              Comment c&apos;est dépensé
            </Onglet>
          </div>

          <div className="flex items-center gap-4">
            {deplies.size > 0 ? (
              <button
                onClick={() => setDeplies(new Set())}
                className="text-[13px] text-ink-doux underline decoration-trait underline-offset-4 hover:text-ink"
              >
                Tout replier
              </button>
            ) : null}
            <label className="flex items-center gap-2 text-[13px] text-ink-doux">
              Année
              <select
                value={meta.annee}
                onChange={(e) => changerAnnee(Number(e.target.value))}
                className="rounded-md border border-trait bg-paper px-2.5 py-1.5 text-[13px] font-medium text-ink tabular-nums outline-none focus:border-ink"
              >
                {[...index.annees].reverse().map((a) => (
                  <option key={a} value={a} disabled={!anneesCompletes.has(a)}>
                    {a}
                    {anneesCompletes.has(a) ? "" : " — détail non publié"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="mb-3 text-[13.5px] text-ink-doux">
          Chaque ruban est un flux d&apos;argent, à l&apos;échelle.{" "}
          <span className="text-ink">Cliquez sur un poste marqué ▸</span> pour l&apos;ouvrir et
          voir ce qu&apos;il contient.
          <span className="sm:hidden"> Faites glisser le diagramme pour le parcourir.</span>
        </p>

        <div className={chargement ? "opacity-40 transition-opacity" : "transition-opacity"}>
          <Sankey graphe={graphe} population={pop} onBasculer={basculer} />
        </div>

        <div className="mt-2 flex flex-wrap justify-between gap-4 border-t border-trait pt-3 text-[12px] uppercase tracking-[0.08em] text-ink-doux">
          <span>D&apos;où vient l&apos;argent</span>
          <span>
            {mode === "fonction" ? "À quoi il sert (fonctions CFAP)" : "Sous quelle forme il sort"}
          </span>
        </div>

        <section className="mt-14 grid gap-9 border-t border-trait pt-10 md:mt-16 md:grid-cols-3">
          <div className="md:col-span-3">
            <h2 className="font-titre text-2xl">
              Combien coûte le fonctionnement de la machine ?
            </h2>
          </div>
          <Bloc
            titre="Faire tourner l'appareil public"
            montant={milliards(fonctionnement)}
            part={pourcent(fonctionnement / agregats.depenses)}
          >
            Les rémunérations des agents publics et tout ce que les administrations achètent pour
            fonctionner. L&apos;essentiel n&apos;est pas de l&apos;administration au sens péjoratif :
            ce sont les salaires des enseignants, des soignants, des policiers et des militaires,
            c&apos;est-à-dire le service lui-même.
          </Bloc>
          <Bloc
            titre="Redistribué directement"
            montant={milliards(redistribution)}
            part={pourcent(redistribution / agregats.depenses)}
          >
            Retraites, allocations chômage et familiales, remboursements de soins. Cet argent
            traverse la sphère publique sans y rester : il est collecté puis reversé aux ménages.
          </Bloc>
          <Bloc
            titre="Intérêts de la dette"
            montant={milliards(interets)}
            part={pourcent(interets / agregats.depenses)}
          >
            Le prix des emprunts passés. Cette charge ne finance aucun service : c&apos;est le coût
            des déficits accumulés les années précédentes.
          </Bloc>
        </section>
      </div>
    </>
  );
}

function Onglet({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={actif}
      className={`flex-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors sm:flex-none sm:px-4 sm:text-[13.5px] ${
        actif ? "bg-ink text-paper" : "text-ink-doux hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Bloc({
  titre,
  montant,
  part,
  children,
}: {
  titre: string;
  montant: string;
  part: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-titre text-[1.6rem] tabular-nums">{montant}</div>
      <div className="text-[13px] text-ink-doux tabular-nums">{part} des dépenses</div>
      <h3 className="mt-3 text-[14.5px] font-semibold">{titre}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-doux">{children}</p>
    </div>
  );
}
