"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Entete from "./Entete";
import Revelation from "./Revelation";
import Controles from "./Controles";
import Reperes from "./Reperes";
import Sankey from "./Sankey";
import Palmares from "./Palmares";
import QuiDepense from "./QuiDepense";
import Historique from "./Historique";
import Administration from "./Administration";
import PouvoirsPublics from "./PouvoirsPublics";
import { classer, classerRessources, construireGraphe } from "@/lib/modele";
import {
  LIBELLES_UNITES,
  euros,
  formater,
  milliards,
  pourcent,
  type Unite,
} from "@/lib/format";
import type { Annee, Index, Mode } from "@/lib/types";
import { chemin } from "@/lib/chemin";

export default function Explorateur({
  initiale,
  index,
  maj,
}: {
  initiale: Annee;
  index: Index;
  maj: string;
}) {
  const [donnees, setDonnees] = useState(initiale);
  const [mode, setMode] = useState<Mode>("fonction");
  const [unite, setUnite] = useState<Unite>("milliards");
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

  // La ventilation par fonction arrive un an après les agrégats. Sur une année
  // trop récente, on bascule sur la lecture par nature et on le dit, plutôt
  // que d'afficher un diagramme amputé de son côté droit.
  const detailFonction = donnees.fonctions.length > 0;
  const modeEffectif: Mode = detailFonction ? mode : "nature";
  const replie = !detailFonction && mode === "fonction";

  const graphe = useMemo(
    () => construireGraphe(donnees, modeEffectif, deplies),
    [donnees, modeEffectif, deplies],
  );

  const { agregats, meta } = donnees;
  const bareme = useMemo(
    () => ({ total: agregats.depenses, population: agregats.population }),
    [agregats.depenses, agregats.population],
  );

  const emplois = modeEffectif === "fonction" ? donnees.fonctions : donnees.natures;
  const rangsEmplois = useMemo(
    () => classer(emplois, agregats.depenses),
    [emplois, agregats.depenses],
  );
  const rangsFonctions = useMemo(
    () => classer(donnees.fonctions, agregats.depenses),
    [donnees.fonctions, agregats.depenses],
  );
  const rangsRessources = useMemo(() => classerRessources(donnees), [donnees]);

  // Ce que coûte le fonctionnement de l'appareil public lui-même.
  const nature = (code: string) => donnees.natures.find((n) => n.code === code)?.montant ?? 0;
  const fonctionnement = nature("SALAIRES") + nature("FONCTIONNEMENT");
  const redistribution = nature("PRESTA_ESPECES") + nature("PRESTA_NATURE");
  const interets = nature("INTERETS");
  const emprunt = Math.abs(Math.min(agregats.solde, 0));

  const anneesCompletes = useMemo(() => new Set(index.anneesCompletes), [index.anneesCompletes]);
  const attenue = chargement ? "opacity-45 transition-opacity" : "transition-opacity";

  return (
    <>
      <Entete donnees={donnees} maj={maj} />

      <Controles
        annee={meta.annee}
        annees={index.annees}
        anneesCompletes={anneesCompletes}
        onAnnee={changerAnnee}
        mode={mode}
        onMode={setMode}
        detailFonction={detailFonction}
        unite={unite}
        onUnite={setUnite}
        chargement={chargement}
      />

      <div className={attenue}>
        <section id="reperes" className="border-b border-trait bg-fond-2 py-7">
          <div className="mx-auto max-w-[1240px] px-5">
            <Reperes donnees={donnees} index={index} />
          </div>
        </section>

        <div className="mx-auto max-w-[1240px] px-5">
          <Section
            numero="01"
            id="flux"
            titre="Le mouvement, à l'échelle"
            chapo={
              <>
                Chaque ruban est un flux d&apos;argent, épais à proportion de son montant. À gauche
                tout ce qui finance l&apos;année, y compris ce qui est emprunté ; au centre le total ;
                à droite ce qu&apos;il paie.{" "}
                <span className="font-medium text-encre">
                  Cliquez sur un poste marqué ▸ pour l&apos;ouvrir.
                </span>
              </>
            }
          >
            {replie ? <Repli annee={meta.annee} /> : null}

            <Legende mode={modeEffectif} />

            <div className="mt-4">
              <Sankey graphe={graphe} bareme={bareme} unite={unite} onBasculer={basculer} />
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-trait pt-3 text-[12px] uppercase tracking-[0.08em] text-encre-2">
              <span>D&apos;où vient l&apos;argent</span>
              <span className="normal-case tracking-normal text-encre-3">
                {LIBELLES_UNITES[unite].long}
              </span>
              <span>
                {modeEffectif === "fonction" ? "À quoi il sert" : "Sous quelle forme il sort"}
              </span>
            </div>

            {deplies.size > 0 ? (
              <button
                onClick={() => setDeplies(new Set())}
                className="lien mt-3 text-[13px] text-encre-2 hover:text-encre"
              >
                Tout replier
              </button>
            ) : null}

            <p className="mt-4 text-[12.5px] leading-relaxed text-encre-3 lg:hidden">
              Le diagramme se fait glisser horizontalement. Sur un petit écran, la liste classée
              ci-dessous se lit plus confortablement.
            </p>
          </Section>

          <Section
            numero="02"
            id="detail"
            titre="Poste par poste"
            chapo={
              <>
                Le même contenu, classé du plus gros au plus petit. Chaque ligne porte son
                montant écrit, ici {LIBELLES_UNITES[unite].long.toLowerCase()}. Ouvrez une ligne
                pour voir ce qu&apos;elle contient.
              </>
            }
          >
            <div className="grid gap-10 md:grid-cols-2 md:gap-12">
              <Palmares
                titre="D'où vient l'argent"
                soustitre={`Les recettes de l'année, plus les ${milliards(emprunt)} empruntés pour couvrir l'écart. Les deux colonnes portent donc le même total.`}
                rangs={rangsRessources}
                bareme={bareme}
                unite={unite}
              />
              <Palmares
                titre={modeEffectif === "fonction" ? "À quoi il sert" : "Sous quelle forme il sort"}
                soustitre={
                  modeEffectif === "fonction"
                    ? "Classification européenne des fonctions des administrations publiques (CFAP)."
                    : "Nature économique de la dépense : ce que l'argent devient en sortant."
                }
                rangs={rangsEmplois}
                bareme={bareme}
                unite={unite}
              />
            </div>
          </Section>

          <Section
            numero="03"
            id="administrations"
            titre="Qui dépense"
            chapo={
              <>
                « L&apos;État » ne dépense qu&apos;un peu plus d&apos;un tiers de l&apos;argent
                public. Le reste passe par la sécurité sociale et par les collectivités locales,
                qui ont leurs propres recettes et leurs propres décisions.
              </>
            }
          >
            <QuiDepense
              donnees={donnees}
              rangs={rangsFonctions}
              bareme={bareme}
              unite={unite}
            />
          </Section>

          <Section
            numero="04"
            id="trajectoire"
            titre={`Depuis ${index.annees[0]}`}
            chapo={
              <>
                Les dépenses et les recettes d&apos;une seule année ne disent pas si l&apos;on est
                dans une situation exceptionnelle ou ordinaire. Survolez une année pour la lire ;
                cliquez pour recharger toute la page dessus.
              </>
            }
          >
            <Historique index={index} annee={meta.annee} onAnnee={changerAnnee} />
          </Section>

          {donnees.administration ? (
            <Section
              numero="05"
              id="administration"
              titre="Ce que l'administration se coûte à elle-même"
              chapo={
                <>
                  Combien coûte l&apos;appareil administratif pour lui-même, une fois retirés les
                  enseignants, les soignants, les policiers et les militaires ? La question n&apos;a
                  pas de réponse d&apos;un seul chiffre, mais elle en a une : il faut croiser la
                  fonction de la dépense et sa nature économique, et dire ce que la source ne
                  permet pas de séparer.
                </>
              }
            >
              <Administration
                administration={donnees.administration}
                donnees={donnees}
                index={index}
                bareme={bareme}
                unite={unite}
              />
            </Section>
          ) : null}

          <Section
            numero={donnees.administration ? "06" : "05"}
            id="pouvoirs"
            titre="Les élus, à l'échelle"
            chapo={
              <>
                La dernière lecture change de source et d&apos;ordre de grandeur. Les comptes
                nationaux ne distinguent jamais les élus des agents : ces montants viennent des
                documents budgétaires français, saisis à la main et datés un par un.
              </>
            }
          >
            <PouvoirsPublics donnees={donnees} index={index} />
          </Section>

          <Section
            numero={donnees.administration ? "07" : "06"}
            id="retenir"
            titre="Trois choses à retenir"
            chapo={
              <>
                Les trois lectures qui changent le plus souvent l&apos;idée qu&apos;on se fait de
                la dépense publique.
              </>
            }
          >
            <div className="grid gap-8 md:grid-cols-3 md:gap-10">
              <Bloc
                titre="L'essentiel est reversé, pas consommé"
                montant={formater(redistribution, unite, bareme)}
                part={unite === "part" ? null : pourcent(redistribution / agregats.depenses)}
                ton="bleu"
              >
                Retraites, allocations chômage et familiales, remboursements de soins. Cet argent
                traverse la sphère publique sans y rester : il est collecté puis reversé aux
                ménages. Le réduire, c&apos;est réduire ce que touchent des gens.
              </Bloc>
              <Bloc
                titre="Faire tourner l'appareil public"
                montant={formater(fonctionnement, unite, bareme)}
                part={unite === "part" ? null : pourcent(fonctionnement / agregats.depenses)}
                ton="encre"
                delai={0.08}
              >
                Les rémunérations des agents publics et tout ce que les administrations achètent
                pour fonctionner. L&apos;essentiel n&apos;est pas de l&apos;administration au sens
                péjoratif : ce sont les salaires des enseignants, des soignants, des policiers et
                des militaires, c&apos;est-à-dire le service lui-même.
              </Bloc>
              <Bloc
                titre="Les intérêts ne financent aucun service"
                montant={formater(interets, unite, bareme)}
                part={unite === "part" ? null : pourcent(interets / agregats.depenses)}
                ton="rouge"
                delai={0.16}
              >
                Le prix des emprunts passés, soit{" "}
                {euros((interets * 1e6) / agregats.population)} par habitant et par an. Cette
                charge ne paie ni un professeur, ni un lit d&apos;hôpital : c&apos;est le coût des
                déficits accumulés les années précédentes.
              </Bloc>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

/**
 * Le titre tient la colonne de gauche, le chapô celle de droite : la page
 * occupe alors toute sa largeur au lieu de s'entasser d'un seul côté, et l'œil
 * sait où commencer.
 */
function Section({
  numero,
  id,
  titre,
  chapo,
  children,
}: {
  numero: string;
  id: string;
  titre: string;
  chapo: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-trait py-12 first:border-t-0 md:py-16">
      <Revelation>
        <div className="grid gap-x-12 gap-y-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="filet-tricolore h-[3px] w-9 rounded-full" aria-hidden="true" />
              <span className="text-[12px] font-semibold tabular-nums tracking-[0.08em] text-encre-3">
                {numero}
              </span>
            </div>
            <h2 className="mt-3.5 font-titre text-[1.75rem] leading-tight tracking-[-0.015em] md:text-[2.15rem]">
              {titre}
            </h2>
          </div>
          <p className="max-w-[68ch] text-[14.5px] leading-relaxed text-encre-2 lg:col-span-7 lg:pt-11">
            {chapo}
          </p>
        </div>
        <div className="mt-9">{children}</div>
      </Revelation>
    </section>
  );
}

/** L'année choisie n'a pas encore de détail par fonction : on l'annonce. */
function Repli({ annee }: { annee: number }) {
  return (
    <p className="mb-4 rounded-lg border border-trait bg-fond-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-encre-2">
      <strong className="font-semibold text-encre">Détail {annee} partiel.</strong> La ventilation
      par fonction de {annee} n&apos;est pas encore publiée : Eurostat la diffuse environ un an
      après les agrégats. La dépense est donc montrée par nature économique.
    </p>
  );
}

/** Ce que veut dire chaque famille de couleurs, dit une fois pour toutes. */
function Legende({ mode }: { mode: Mode }) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-encre-2">
      <Cle couleurs={["#063898", "#204ea7", "#3763b6", "#4e78c5"]}>
        Prélèvements obligatoires
      </Cle>
      <Cle couleurs={["#00656f", "#007981", "#008e95", "#1aa2a9"]}>Autres ressources</Cle>
      <Cle couleurs={["#b01b2e"]}>Emprunt de l&apos;année</Cle>
      <Cle couleurs={["#8a3aa0", "#227f53", "#b07a00", "#c34517"]}>
        {mode === "fonction" ? "Fonctions" : "Natures de dépense"}
      </Cle>
    </ul>
  );
}

function Cle({ couleurs, children }: { couleurs: string[]; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className="flex h-3 gap-[2px]">
        {couleurs.map((c) => (
          <span key={c} className="w-[7px] rounded-[2px]" style={{ background: c }} />
        ))}
      </span>
      {children}
    </li>
  );
}

/** Bleu ce qui entre, rouge ce qui manque, encre le reste : la règle du site. */
const TONS = {
  bleu: { trait: "border-bleu", texte: "text-bleu" },
  encre: { trait: "border-encre", texte: "text-encre" },
  rouge: { trait: "border-rouge", texte: "text-rouge" },
} as const;

function Bloc({
  titre,
  montant,
  part,
  ton,
  delai = 0,
  children,
}: {
  titre: string;
  montant: string;
  /** Nul quand l'unité affichée est déjà une part : on ne l'écrit pas deux fois. */
  part: string | null;
  ton: keyof typeof TONS;
  delai?: number;
  children: React.ReactNode;
}) {
  return (
    <Revelation delai={delai} className={`border-t-2 pt-4 ${TONS[ton].trait}`}>
      <div className={`font-titre text-[1.7rem] leading-none tabular-nums ${TONS[ton].texte}`}>
        {montant}
      </div>
      <div className="mt-1 text-[12.5px] tabular-nums text-encre-3">
        {part ? `${part} des dépenses` : "des dépenses de l'année"}
      </div>
      <h3 className="mt-3 text-[15px] font-semibold leading-snug">{titre}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-encre-2">{children}</p>
    </Revelation>
  );
}
