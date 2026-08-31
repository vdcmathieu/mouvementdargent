"use client";

import { TEINTES_SECTEURS } from "@/lib/palette";
import { formater, milliards, pourcent, type Bareme, type Unite } from "@/lib/format";
import type { Annee } from "@/lib/types";
import type { Rang } from "@/lib/modele";

/**
 * Qui dépense l'argent public. « L'État » ne dépense qu'un peu plus d'un tiers
 * du total : le reste passe par la sécurité sociale et par les collectivités.
 * C'est probablement le contresens le plus répandu sur le sujet, et les données
 * publiées permettent de le lever directement.
 *
 * Attention : les montants par administration ne sont PAS consolidés. L'État
 * verse chaque année des sommes considérables aux deux autres, et ces sommes
 * sont comptées des deux côtés. Leur somme dépasse donc le total consolidé.
 * On ne corrige rien, on le dit.
 */
export default function QuiDepense({
  donnees,
  rangs,
  bareme,
  unite,
}: {
  donnees: Annee;
  /** Les fonctions classées, pour la ventilation par administration. */
  rangs: Rang[];
  bareme: Bareme;
  unite: Unite;
}) {
  const admins = [...donnees.administrations].sort((a, b) => b.depenses - a.depenses);
  const maxi = Math.max(...admins.map((a) => a.depenses));
  const cumul = admins.reduce((a, x) => a + x.depenses, 0);

  const ventilees = rangs.filter(
    (r) => r.parSecteur && Object.values(r.parSecteur).some((v) => v > 0),
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
      <div>
        <ul className="space-y-4">
          {admins.map((a) => {
            const couleur = TEINTES_SECTEURS[a.code] ?? "#8a8e99";
            const solde = a.recettes - a.depenses;
            return (
              <li key={a.code} className="rounded-carte border border-trait bg-carte p-4">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: couleur }}
                    />
                    {a.nom}
                  </h3>
                  <span className="shrink-0 font-titre text-[1.3rem] leading-none tabular-nums">
                    {formater(a.depenses, unite, bareme)}
                  </span>
                </div>

                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-fond-3">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(a.depenses / maxi) * 100}%`, background: couleur }}
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-2.5 text-[13px] leading-relaxed text-encre-2">{a.description}</p>

                <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-trait pt-2.5 text-[12px]">
                  <div>
                    <dt className="text-encre-3">Recettes</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{milliards(a.recettes)}</dd>
                  </div>
                  <div>
                    <dt className="text-encre-3">Solde</dt>
                    <dd
                      className={`mt-0.5 font-medium tabular-nums ${solde < 0 ? "text-rouge" : "text-vert"}`}
                    >
                      {solde < 0 ? "−" : "+"}
                      {milliards(Math.abs(solde), 1)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-encre-3">Masse salariale</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{milliards(a.agents)}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-[12.5px] leading-relaxed text-encre-2">
          Ces trois montants s&apos;additionnent à {milliards(cumul)}, soit davantage que les{" "}
          {milliards(donnees.agregats.depenses)} de dépense publique : l&apos;État verse chaque
          année aux deux autres des sommes qui sont comptées de part et d&apos;autre. Le total
          consolidé les retire une fois. Aucun ajustement n&apos;est appliqué ici.
        </p>
      </div>

      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.09em]">
          Qui porte quelle mission
        </h3>
        <p className="mt-2 max-w-[56ch] text-[13px] leading-relaxed text-encre-2">
          Pour chaque grande fonction, la part portée par chacune des trois administrations, avant
          consolidation. Les retraites et l&apos;assurance maladie passent presque entièrement par
          la sécurité sociale ; les équipements collectifs, presque entièrement par les communes,
          départements et régions.
        </p>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px]">
          {Object.entries(donnees.secteurs)
            .filter(([code]) => code !== "S13")
            .map(([code, s]) => (
              <span key={code} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: TEINTES_SECTEURS[code] ?? "#8a8e99" }}
                />
                {s.court}
              </span>
            ))}
        </div>

        {ventilees.length === 0 ? (
          <p className="mt-4 rounded-lg border border-trait bg-fond-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-encre-2">
            La ventilation par fonction de {donnees.meta.annee} n&apos;est pas encore publiée. Les
            montants par administration, eux, le sont : ils figurent à gauche.
          </p>
        ) : null}

        <ul className="mt-4 space-y-3">
          {ventilees.map((r) => {
            const brut = ["S1311", "S1313", "S1314"]
              .map((code) => [code, r.parSecteur![code] ?? 0] as const)
              .filter(([, v]) => v > 0);
            const somme = brut.reduce((a, [, v]) => a + v, 0);
            // En dessous de 1 %, le segment est invisible et la mention « 0 % »
            // n'apprend rien : on ne le dessine pas.
            const ordonnees = brut.filter(([, v]) => v / somme >= 0.01);
            return (
              <li key={r.code}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="min-w-0 truncate text-[13.5px] font-medium">{r.libelle}</span>
                  <span className="shrink-0 pl-2 text-[12.5px] tabular-nums text-encre-2">
                    {formater(r.montant, unite, bareme)}
                  </span>
                </div>
                <div className="mt-1.5 flex h-3.5 w-full overflow-hidden rounded-sm">
                  {ordonnees.map(([code, v], i) => (
                    <span
                      key={code}
                      className={`h-full ${i > 0 ? "border-l-2 border-fond" : ""}`}
                      style={{
                        width: `${(v / somme) * 100}%`,
                        background: TEINTES_SECTEURS[code] ?? "#8a8e99",
                      }}
                      title={`${donnees.secteurs[code]?.court ?? code} : ${milliards(v)} (${pourcent(
                        v / somme,
                      )})`}
                    />
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-[11.5px] tabular-nums text-encre-3">
                  {ordonnees.map(([code, v]) => (
                    <span key={code}>
                      {donnees.secteurs[code]?.court ?? code} {pourcent(v / somme, 0)}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
