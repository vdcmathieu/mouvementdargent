"use client";

import TeteDeBloc from "./TeteDeBloc";
import { Miniature } from "./graphiques";
import { libelleCourt } from "@/lib/libelles";
import { TEINTES_SECTEURS, eclaircir, teinte, voile } from "@/lib/palette";
import { formater, milliards, parHabitant, pourcent, type Bareme, type Unite } from "@/lib/format";
import type { Administration as Donnees, Annee, Index } from "@/lib/types";

const OCRE = teinte("GF01");
/** Ce qui traverse une ligne budgétaire administrative sans la faire tourner. */
const NEUTRE = "#8a8e99";

/**
 * L'administration qui s'administre.
 *
 * La question posée est simple et n'a pas de réponse simple : combien coûte
 * l'appareil administratif pour lui-même, une fois retirés les enseignants,
 * les soignants, les policiers et les militaires ? Les comptes nationaux y
 * répondent partiellement, à condition de croiser deux classifications que
 * personne ne croise d'habitude : la fonction (à quoi sert la dépense) et la
 * nature économique (ce que l'argent devient).
 *
 * Sans ce croisement, la contribution française au budget de l'Union
 * européenne — 26 milliards rangés par la CFAP dans les services généraux —
 * compterait comme du coût d'administration. C'est l'erreur la plus commune
 * sur ce chiffre, et elle double presque le résultat.
 */
export default function Administration({
  administration,
  donnees,
  index,
  bareme,
  unite,
}: {
  administration: Donnees;
  donnees: Annee;
  index: Index;
  bareme: Bareme;
  unite: Unite;
}) {
  const { division, interne, horsInterne, remunerations } = administration;
  const { agregats, meta } = donnees;

  const fonctionnement = interne.natures.filter((n) => n.fonctionnement);
  const transite = interne.natures.filter((n) => !n.fonctionnement);
  const montantTransite = transite.reduce((a, n) => a + n.montant, 0);

  const remunAdmin = fonctionnement.find((n) => n.code === "D1")?.montant ?? 0;
  const trajectoire = index.historique
    .filter((h) => h.administration !== null)
    .map((h) => ({ annee: h.annee, valeur: (h.administration as number) / h.depenses }));
  const premier = trajectoire[0];
  const dernier = trajectoire[trajectoire.length - 1];

  return (
    <div className="space-y-11">
      {/* ---- les trois chiffres qui portent la section ---- */}
      <div className="grid gap-8 md:grid-cols-3 md:gap-10">
        <Chiffre
          titre="Le fonctionnement propre"
          montant={formater(interne.fonctionnement, unite, bareme)}
          legende={
            unite === "part"
              ? "de la dépense publique"
              : `${pourcent(interne.fonctionnement / agregats.depenses)} de la dépense publique`
          }
        >
          Des agents, des achats et des bâtiments, pour les fonctions qui
          n&apos;administrent qu&apos;elles-mêmes : direction politique, collecte de
          l&apos;impôt, gestion du personnel, planification, statistique, achats,
          immobilier. Soit {parHabitant(interne.fonctionnement, agregats.population)} par habitant
          et par an.
        </Chiffre>
        <Chiffre
          titre="Dont des rémunérations"
          montant={formater(remunAdmin, unite, bareme)}
          legende={`${pourcent(remunAdmin / remunerations.total)} de toute la masse salariale publique`}
        >
          Le reste de la masse salariale paie des gens qui rendent un service
          identifiable : {(remunerations.parFonction[0]?.libelle ?? "").toLowerCase()} et{" "}
          {(remunerations.parFonction[1]?.libelle ?? "").toLowerCase()} à elles seules pèsent{" "}
          {milliards(
            (remunerations.parFonction[0]?.montant ?? 0) +
              (remunerations.parFonction[1]?.montant ?? 0),
          )}
          .
        </Chiffre>
        <div className="border-t-2 border-encre pt-4">
          <div className="font-titre text-[1.7rem] leading-none tabular-nums">
            {pourcent(dernier.valeur)}
          </div>
          <div className="mt-1 text-[12.5px] tabular-nums text-encre-3">
            de la dépense en {dernier.annee}, contre {pourcent(premier.valeur)} en {premier.annee}
          </div>
          <h3 className="mt-3 text-[15px] font-semibold leading-snug">La part ne dérive pas</h3>
          <div className="mt-2">
            <Miniature points={trajectoire} couleur={OCRE} actif={meta.annee} largeur={132} />
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-encre-2">
            En euros courants, le fonctionnement propre passe de{" "}
            {milliards(index.historique.find((h) => h.annee === premier.annee)!.administration!)} à{" "}
            {milliards(interne.fonctionnement)}. Rapporté à la dépense totale, il bouge peu.
          </p>
        </div>
      </div>

      {/* ---- ce qu'on garde, ce qu'on écarte ---- */}
      <Bloc
        titre="Ce qu'on compte, et ce qu'on écarte"
        chapo={
          <>
            Tout part de la division 01 de la classification européenne des fonctions, «{" "}
            {division.libelle.toLowerCase()} », qui pèse {milliards(division.montant)}. Elle est
            trompeuse : quatre de ses huit groupes n&apos;ont rien à voir avec le fonctionnement de
            l&apos;administration. On les écarte, on ne les fond pas dedans.
          </>
        }
      >
        <ul className="mt-1 max-w-[1060px]">
          {interne.postes.map((p) => (
            <Ligne
              key={p.code}
              libelle={libelleCourt(p.code, p.libelle)}
              officiel={p.libelle}
              montant={p.montant}
              largeur={p.montant / division.montant}
              couleur={OCRE}
              bareme={bareme}
              unite={unite}
            />
          ))}
          {horsInterne.map((p) => (
            <Ligne
              key={p.code}
              libelle={libelleCourt(p.code, p.libelle)}
              officiel={p.libelle}
              montant={p.montant}
              largeur={p.montant / division.montant}
              couleur={NEUTRE}
              bareme={bareme}
              unite={unite}
              attenue
            />
          ))}
        </ul>
        <p className="mt-3 max-w-[62ch] text-[12.5px] leading-relaxed text-encre-2">
          <strong className="font-semibold text-encre">Une limite qu&apos;on ne peut pas
          lever.</strong>{" "}
          Eurostat s&apos;arrête au deuxième niveau de la classification. Le premier groupe réunit
          donc dans un seul montant la direction politique du pays, l&apos;administration fiscale
          et la diplomatie. Aucune clé de répartition n&apos;est publiée entre les trois, et on
          n&apos;en invente pas : la diplomatie reste comptée ici, faute de pouvoir l&apos;en
          sortir honnêtement.
        </p>
      </Bloc>

      {/* ---- fonctionnement contre argent de passage ---- */}
      <Bloc
        titre="Des gens, des achats, des murs — et de l'argent qui ne fait que passer"
        chapo={
          <>
            Les {milliards(interne.montant)} retenus ne sont pas tous du coût de fonctionnement.
            En croisant avec la nature économique de la dépense, {milliards(montantTransite)}{" "}
            s&apos;avèrent être des transferts : de l&apos;argent inscrit sur la ligne d&apos;un
            service administratif, mais versé ailleurs — au premier rang duquel la contribution
            de la France au budget de l&apos;Union européenne.
          </>
        }
      >
        <Barre
          className="max-w-[1060px]"
          segments={[
            ...fonctionnement.map((n, i) => ({
              cle: n.code,
              libelle: n.libelle,
              montant: n.montant,
              couleur: eclaircir(OCRE, i * 0.2),
            })),
            ...transite.map((n, i) => ({
              cle: n.code,
              libelle: n.libelle,
              montant: n.montant,
              couleur: eclaircir(NEUTRE, i * 0.16),
            })),
          ]}
          total={interne.montant}
        />
        <dl className="mt-5 grid max-w-[1060px] gap-x-10 gap-y-1.5 sm:grid-cols-2">
          {fonctionnement.map((n, i) => (
            <Definition
              key={n.code}
              libelle={n.libelle}
              montant={n.montant}
              total={interne.montant}
              couleur={eclaircir(OCRE, i * 0.2)}
              bareme={bareme}
              unite={unite}
            />
          ))}
          {transite.map((n, i) => (
            <Definition
              key={n.code}
              libelle={n.libelle}
              montant={n.montant}
              total={interne.montant}
              couleur={eclaircir(NEUTRE, i * 0.16)}
              bareme={bareme}
              unite={unite}
            />
          ))}
        </dl>
        <dl className="mt-3 grid max-w-[1060px] gap-x-10 gap-y-1.5 border-t-2 border-encre pt-2 sm:grid-cols-2">
          <Definition
            libelle="Coût de fonctionnement"
            montant={interne.fonctionnement}
            total={interne.montant}
            couleur={OCRE}
            bareme={bareme}
            unite={unite}
            fort
          />
          <Definition
            libelle="Argent qui ne fait que passer"
            montant={montantTransite}
            total={interne.montant}
            couleur={NEUTRE}
            bareme={bareme}
            unite={unite}
            fort
          />
        </dl>
      </Bloc>

      {/* ---- la masse salariale, par fonction ---- */}
      <Bloc
        titre="Sur cent euros de salaire public, combien pour l'administration ?"
        chapo={
          <>
            La question revient toujours à celle-ci : parmi les{" "}
            {milliards(remunerations.total)} de rémunérations publiques, quelle part ne paie ni un
            enseignant, ni un soignant, ni un policier ? La ventilation de la masse salariale par
            fonction y répond directement.
          </>
        }
      >
        <ul className="mt-1 max-w-[1060px]">
          {remunerations.parFonction.map((f) => (
            <Ligne
              key={f.code}
              libelle={libelleCourt(f.code, f.libelle)}
              officiel={f.libelle}
              montant={f.montant}
              largeur={f.montant / remunerations.parFonction[0].montant}
              couleur={teinte(f.code)}
              bareme={{ total: remunerations.total, population: bareme.population }}
              unite={unite}
            />
          ))}
        </ul>
        <p className="mt-3 max-w-[62ch] text-[12.5px] leading-relaxed text-encre-2">
          La ligne des services généraux, {milliards(
            remunerations.parFonction.find((f) => f.code === "GF01")?.montant ?? 0,
          )}
          , inclut encore les chercheurs de la recherche fondamentale et le personnel diplomatique.
          Restreinte aux seules fonctions d&apos;auto-administration, elle vaut{" "}
          {milliards(remunAdmin)}.
        </p>
      </Bloc>

      {/* ---- qui porte ce coût ---- */}
      <Bloc
        titre="Ce n'est pas surtout l'État"
        chapo={
          <>
            La réforme qu&apos;on imagine se joue rue de Rivoli. Les montants disent autre chose :
            l&apos;administration générale pèse davantage dans les communes, les départements et
            les régions qu&apos;à l&apos;État.
          </>
        }
      >
        <Barre
          className="max-w-[1060px]"
          segments={Object.entries(interne.parSecteur)
            .sort((a, b) => b[1] - a[1])
            .map(([code, montant]) => ({
              cle: code,
              libelle: donnees.secteurs[code]?.nom ?? code,
              montant,
              couleur: TEINTES_SECTEURS[code] ?? NEUTRE,
            }))}
          total={Object.values(interne.parSecteur).reduce((a, b) => a + b, 0)}
        />
        <dl className="mt-5 grid max-w-[1060px] gap-x-6 gap-y-1.5 sm:grid-cols-3">
          {Object.entries(interne.parSecteur)
            .sort((a, b) => b[1] - a[1])
            .map(([code, montant]) => (
              <Definition
                key={code}
                libelle={donnees.secteurs[code]?.nom ?? code}
                montant={montant}
                total={Object.values(interne.parSecteur).reduce((a, b) => a + b, 0)}
                couleur={TEINTES_SECTEURS[code] ?? NEUTRE}
                bareme={bareme}
                unite={unite}
              />
            ))}
        </dl>
        <p className="mt-3 max-w-[62ch] text-[12.5px] leading-relaxed text-encre-2">
          Ces trois montants ne sont pas consolidés : quand l&apos;État verse une dotation à une
          commune, la somme est comptée des deux côtés. Leur total dépasse donc les{" "}
          {milliards(interne.montant)} de l&apos;ensemble. On ne corrige rien, on le signale.
        </p>
      </Bloc>
    </div>
  );
}

/* ------------------------------------------------------------------ pièces */

function Chiffre({
  titre,
  montant,
  legende,
  children,
}: {
  titre: string;
  montant: string;
  legende: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t-2 border-encre pt-4">
      <div className="font-titre text-[1.7rem] leading-none tabular-nums">{montant}</div>
      <div className="mt-1 text-[12.5px] tabular-nums text-encre-3">{legende}</div>
      <h3 className="mt-3 text-[15px] font-semibold leading-snug">{titre}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-encre-2">{children}</p>
    </div>
  );
}

function Bloc({
  titre,
  chapo,
  children,
}: {
  titre: string;
  chapo: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0">
      <TeteDeBloc titre={titre}>{chapo}</TeteDeBloc>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * Une ligne de liste avec son fond proportionnel. Les postes écartés portent la
 * même barre en gris et un libellé barré : on les voit, on sait qu'ils existent,
 * on sait qu'ils ne sont pas comptés.
 */
function Ligne({
  libelle,
  officiel,
  montant,
  largeur,
  couleur,
  bareme,
  unite,
  attenue = false,
}: {
  libelle: string;
  officiel: string;
  montant: number;
  largeur: number;
  couleur: string;
  bareme: Bareme;
  unite: Unite;
  /** Le poste est montré pour mémoire, mais n'entre pas dans le total. */
  attenue?: boolean;
}) {
  return (
    <li className="border-b border-trait last:border-0">
      <div className="relative flex items-baseline gap-3 py-[7px]">
        <span
          aria-hidden="true"
          className="absolute inset-y-[3px] left-0 rounded-[3px]"
          style={{
            width: `${Math.max(largeur, 0) * 100}%`,
            background: voile(couleur, attenue ? 0.93 : 0.84),
          }}
        />
        <span
          aria-hidden="true"
          className="relative z-10 h-2.5 w-2.5 shrink-0 self-center rounded-[3px]"
          style={{ background: couleur, opacity: attenue ? 0.42 : 1 }}
        />
        <span
          className={`relative z-10 min-w-0 flex-1 truncate text-[13.5px] ${
            attenue ? "text-encre-2" : "text-encre"
          }`}
          title={officiel !== libelle ? officiel : undefined}
        >
          {libelle}
        </span>
        <span
          className={`relative z-10 shrink-0 text-[13px] tabular-nums ${
            attenue ? "text-encre-2" : "font-medium"
          }`}
        >
          {formater(montant, unite, bareme)}
        </span>
      </div>
    </li>
  );
}

/** Une barre empilée, sans axe : elle ne sert qu'à donner les proportions. */
function Barre({
  segments,
  total,
  className = "",
}: {
  segments: { cle: string; libelle: string; montant: number; couleur: string }[];
  total: number;
  className?: string;
}) {
  return (
    <div className={`flex h-9 w-full overflow-hidden rounded-[6px] ${className}`} role="img">
      {segments.map((s) => (
        <div
          key={s.cle}
          className="h-full transition-[width] duration-500 ease-out"
          style={{ width: `${(s.montant / total) * 100}%`, background: s.couleur }}
          title={`${s.libelle} — ${milliards(s.montant)}`}
        >
          <span className="sr-only">
            {s.libelle} : {milliards(s.montant)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Definition({
  libelle,
  montant,
  total,
  couleur,
  bareme,
  unite,
  fort = false,
}: {
  libelle: string;
  montant: number;
  total: number;
  couleur: string;
  bareme: Bareme;
  unite: Unite;
  /** Les lignes de synthèse, qui récapitulent celles du dessus. */
  fort?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 ${
        fort ? "" : "border-t border-trait pt-1.5"
      }`}
    >
      <dt
        className={`flex min-w-0 items-center gap-2 text-[13px] ${
          fort ? "font-semibold" : "text-encre-2"
        }`}
      >
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
          style={{ background: couleur }}
        />
        <span className="min-w-0">{libelle}</span>
      </dt>
      <dd
        className={`shrink-0 text-[13px] tabular-nums ${fort ? "font-semibold" : "font-medium"}`}
      >
        {formater(montant, unite, bareme)}
        <span className="ml-2 font-normal text-encre-3">{pourcent(montant / total)}</span>
      </dd>
    </div>
  );
}
