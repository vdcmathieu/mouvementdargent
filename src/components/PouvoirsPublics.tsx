"use client";

import TeteDeBloc from "./TeteDeBloc";
import { euros, eurosPrecis, milliards, pourcent } from "@/lib/format";
import { voile } from "@/lib/palette";
import {
  ENVELOPPES_DEPUTE,
  INDEMNITE_PARLEMENTAIRE,
  TRAITEMENT_EXECUTIF,
  exercicePour,
  type Source,
} from "@/lib/pouvoirs";
import type { Annee, Index } from "@/lib/types";

const TEINTE = "#8a3aa0";

/**
 * Les pouvoirs publics : ce que coûtent les institutions élues, et ce que
 * touche celui ou celle qui y siège.
 *
 * Deux mises en garde tiennent toute la section. La première est de source :
 * ces montants ne viennent pas des comptes nationaux mais de documents
 * budgétaires et parlementaires français, saisis à la main, chacun daté et
 * lié. La seconde est d'échelle : la mission entière pèse moins d'un millième
 * de la dépense publique. Une page qui met en avant le salaire des élus sans
 * afficher cet ordre de grandeur ment par cadrage, même avec des chiffres
 * exacts.
 */
export default function PouvoirsPublics({
  donnees,
  index,
}: {
  donnees: Annee;
  index: Index;
}) {
  const exercice = exercicePour(donnees.meta.annee);
  // La mission n'est saisie que pour quelques exercices. Sur une année plus
  // ancienne, on montre le dernier exercice connu — mais on le compare alors à
  // la dépense de SON année, pas à celle affichée en haut de page : rapporter
  // un montant de 2025 au total de 2018 ne veut rien dire.
  const reference = index.historique.find((h) => h.annee === exercice.annee);
  const depensesEuros = (reference?.depenses ?? donnees.agregats.depenses) * 1e6;
  const memeAnnee = exercice.annee === donnees.meta.annee;
  const depensesMd = reference?.depenses ?? donnees.agregats.depenses;
  const fonctionnement = memeAnnee ? (donnees.administration?.interne.fonctionnement ?? 0) : 0;
  const maxi = Math.max(...exercice.dotations.map((d) => d.montant));

  return (
    <div className="space-y-11">
      <div className="grid gap-8 md:grid-cols-3 md:gap-10">
        <div className="border-t-2 border-encre pt-4 md:col-span-2">
          <div className="font-titre text-[1.7rem] leading-none tabular-nums">
            {euros(exercice.total)}
          </div>
          <div className="mt-1 text-[12.5px] tabular-nums text-encre-3">
            {exercice.intitule}, mission « Pouvoirs publics »
          </div>
          <h3 className="mt-3 text-[15px] font-semibold leading-snug">
            Six institutions qui ne dépendent d&apos;aucun ministère
          </h3>
          <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-encre-2">
            L&apos;Élysée, les deux assemblées, leur chaîne de télévision et les deux juridictions
            constitutionnelles. C&apos;est la seule ligne du budget de l&apos;État qui isole les
            institutions politiques elles-mêmes — la comptabilité nationale, elle, ne les sépare
            jamais des administrations qu&apos;elles dirigent.
          </p>
        </div>
        <div className="border-t-2 border-encre pt-4">
          <div className="font-titre text-[1.7rem] leading-none tabular-nums">
            {pourcent(exercice.total / depensesEuros, 3)}
          </div>
          <div className="mt-1 text-[12.5px] tabular-nums text-encre-3">
            de la dépense publique de {exercice.annee}
          </div>
          <h3 className="mt-3 text-[15px] font-semibold leading-snug">L&apos;ordre de grandeur</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-encre-2">
            {memeAnnee
              ? `Soit ${euros(exercice.total / donnees.agregats.population)} par habitant et par an`
              : `Rapporté à la dépense publique de ${exercice.annee}, le seul exercice comparable saisi ici`}
            {fonctionnement
              ? `, et ${pourcent(exercice.total / (fonctionnement * 1e6), 1)} du coût de fonctionnement de l'administration`
              : ""}
            .
          </p>
        </div>
      </div>

      {/* ---- les six dotations ---- */}
      <section className="min-w-0">
        <TeteDeBloc titre="Dotation par institution">
          Ce sont des crédits votés, pas exécutés : les deux assemblées fixent elles-mêmes leur
          demande, que le Parlement approuve.{exercice.note ? ` ${exercice.note}` : ""}
        </TeteDeBloc>
        <ul className="mt-4 max-w-[1060px]">
          {exercice.dotations.map((d) => (
            <li key={d.code} className="border-b border-trait last:border-0">
              <div className="relative flex items-baseline gap-3 py-[7px]">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-[3px] left-0 rounded-[3px]"
                  style={{ width: `${(d.montant / maxi) * 100}%`, background: voile(TEINTE, 0.86) }}
                />
                <span
                  aria-hidden="true"
                  className="relative z-10 h-2.5 w-2.5 shrink-0 self-center rounded-[3px]"
                  style={{ background: TEINTE }}
                />
                <span className="relative z-10 min-w-0 flex-1 text-[13.5px]">
                  {d.nom}
                  {d.note ? (
                    <span className="ml-2 text-[12px] text-encre-3">{d.note}</span>
                  ) : null}
                </span>
                <span className="relative z-10 shrink-0 text-[13px] font-medium tabular-nums">
                  {euros(d.montant)}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <Provenance source={exercice.source} />
      </section>

      {/* ---- l'indemnité, personne par personne ---- */}
      <section className="min-w-0">
        <TeteDeBloc titre="Ce que touche un parlementaire">
          L&apos;indemnité brute est la même pour un député et pour un sénateur : le même texte la
          fixe pour les deux chambres. Le net diffère parce que la cotisation de retraite
          n&apos;est pas la même de part et d&apos;autre. Montants au{" "}
          {INDEMNITE_PARLEMENTAIRE.dateEffet}.
        </TeteDeBloc>

        <div className="mt-4 grid max-w-[1060px] gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10">
          <div className="rounded-carte border border-trait bg-carte p-4">
            <div className="flex items-baseline justify-between gap-4 border-b border-trait pb-2.5">
              <span className="text-[13px] font-semibold">Indemnité brute mensuelle</span>
              <span className="font-titre text-[1.45rem] leading-none tabular-nums">
                {eurosPrecis(INDEMNITE_PARLEMENTAIRE.brut)}
              </span>
            </div>
            <dl className="mt-2.5 space-y-1.5">
              {INDEMNITE_PARLEMENTAIRE.composantes.map((c) => (
                <div key={c.libelle} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[13px] text-encre-2">{c.libelle}</dt>
                  <dd className="shrink-0 text-[13px] tabular-nums">{eurosPrecis(c.montant)}</dd>
                </div>
              ))}
            </dl>
            <dl className="mt-3 space-y-1.5 border-t border-trait pt-2.5">
              {INDEMNITE_PARLEMENTAIRE.net.map((n) => (
                <div key={n.chambre} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[13px] font-medium">Net mensuel — {n.chambre.toLowerCase()}</dt>
                  <dd className="shrink-0 text-[13px] font-medium tabular-nums">
                    {eurosPrecis(n.montant)}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 border-t border-trait pt-2 text-[12px] text-encre-3">
              {INDEMNITE_PARLEMENTAIRE.net.map((n, i) => (
                <span key={n.chambre}>
                  {i > 0 ? " · " : ""}
                  <a href={n.source.url} className="lien hover:text-encre">
                    {n.chambre}
                  </a>
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[13px] font-semibold">Ce qui n&apos;est pas un revenu</h4>
            <p className="mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-encre-2">
              Deux enveloppes s&apos;ajoutent à l&apos;indemnité et sont régulièrement additionnées
              avec elle. Ce sont des frais et des salaires versés à d&apos;autres personnes : les
              compter comme une rémunération double le chiffre sans rien décrire.
            </p>
            <dl className="mt-3 space-y-3">
              {ENVELOPPES_DEPUTE.map((e) => (
                <div key={e.libelle} className="border-t border-trait pt-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[13px] font-medium">{e.libelle}</dt>
                    <dd className="shrink-0 text-[13px] tabular-nums">{eurosPrecis(e.montant)}</dd>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-encre-2">
                    {e.note} <span className="text-encre-3">({e.dateEffet})</span>
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <p className="mt-5 max-w-[68ch] text-[12.5px] leading-relaxed text-encre-2">
          <strong className="font-semibold text-encre">
            Le Président et les ministres n&apos;ont pas de montant publié.
          </strong>{" "}
          Leur traitement n&apos;est pas fixé en euros mais par une formule indexée sur la grille
          hors échelle de la fonction publique. Il n&apos;existe donc pas de chiffre officiel à
          citer, seulement un mode de calcul — on préfère le dire plutôt qu&apos;afficher un
          montant reconstitué.{" "}
          <a href={TRAITEMENT_EXECUTIF.source.url} className="lien hover:text-encre">
            {TRAITEMENT_EXECUTIF.source.titre}
          </a>
          .
        </p>
      </section>

      {/* ---- la remise à l'échelle ---- */}
      <section className="rounded-carte border border-trait bg-fond-2 p-5">
        <h3 className="text-[15px] font-semibold">
          Remettre les montants côte à côte
        </h3>
        <div className="mt-3.5 max-w-[1060px] space-y-2.5">
          <Echelle
            libelle={`Dépense publique totale ${exercice.annee}`}
            montant={depensesEuros}
            reference={depensesEuros}
            couleur="var(--color-encre)"
            valeur={milliards(depensesMd)}
          />
          {/* Sur une année sans ventilation par fonction, ce montant n'existe
              pas encore : on retire la barre au lieu d'en afficher une vide. */}
          {fonctionnement ? (
            <Echelle
              libelle="Fonctionnement propre de l'administration"
              montant={fonctionnement * 1e6}
              reference={depensesEuros}
              couleur="#874805"
              valeur={milliards(fonctionnement)}
            />
          ) : null}
          <Echelle
            libelle="Mission « Pouvoirs publics »"
            montant={exercice.total}
            reference={depensesEuros}
            couleur={TEINTE}
            valeur={euros(exercice.total)}
          />
        </div>
        <p className="mt-4 max-w-[68ch] text-[12.5px] leading-relaxed text-encre-2">
          La dernière barre est invisible à cette échelle, et c&apos;est le résultat : les
          institutions élues coûtent {pourcent(exercice.total / depensesEuros, 3)} de la dépense
          publique. Le débat sur leur train de vie est légitime, mais il ne porte pas sur le même
          ordre de grandeur que celui sur l&apos;administration — et encore moins que celui sur les
          prestations sociales.
        </p>
      </section>
    </div>
  );
}

function Echelle({
  libelle,
  montant,
  reference,
  couleur,
  valeur,
}: {
  libelle: string;
  montant: number;
  reference: number;
  couleur: string;
  valeur: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[13px] text-encre-2">{libelle}</span>
        <span className="shrink-0 text-[13px] font-medium tabular-nums">{valeur}</span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-fond-3">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max((montant / reference) * 100, 0.12)}%`, background: couleur }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function Provenance({ source }: { source: Source }) {
  return (
    <p className="mt-3 text-[12px] leading-relaxed text-encre-3">
      Source —{" "}
      <a href={source.url} className="lien hover:text-encre">
        {source.titre}
      </a>
      . Relevé le {source.releveLe}, saisie manuelle.
    </p>
  );
}
