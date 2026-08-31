import Explorateur from "@/components/Explorateur";
import { lireAnnee, lireIndex } from "@/lib/donnees";
import { chemin } from "@/lib/chemin";

export const dynamic = "force-static";

export default async function Page() {
  const index = await lireIndex();
  const donnees = await lireAnnee(index.anneeParDefaut);
  const { meta } = donnees;
  const maj = new Date(index.misAJourParEurostat).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main>
      <Explorateur initiale={donnees} index={index} maj={maj} />

      <footer className="mt-16 border-t border-trait bg-fond-2">
        <div className="mx-auto grid max-w-[1240px] gap-9 px-5 py-14 md:grid-cols-3">
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em]">Les données</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-encre-2">
              Comptes nationaux annuels des administrations publiques, produits par l&apos;Insee
              selon le SEC 2010 et diffusés par Eurostat. Aucun chiffre n&apos;est estimé ni
              réparti au jugé.
            </p>
            <ul className="mt-3 space-y-1 text-[13px]">
              {meta.sources.map((s) => (
                <li key={s.id}>
                  <a href={s.url} className="lien hover:text-encre">
                    {s.id}
                  </a>{" "}
                  <span className="text-encre-3">— {s.titre}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em]">
              Reprendre les données
            </h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-encre-2">
              Tout le jeu de données consolidé est téléchargeable en JSON, une année par fichier.
            </p>
            <ul className="mt-3 space-y-1 text-[13px]">
              <li>
                <a href={chemin(`/data/apu-${meta.annee}.json`)} className="lien hover:text-encre">
                  apu-{meta.annee}.json
                </a>
              </li>
              <li>
                <a href={chemin("/data/index.json")} className="lien hover:text-encre">
                  index.json
                </a>{" "}
                <span className="text-encre-3">
                  — série {index.annees[0]}–{index.annees.at(-1)}
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em]">Contribuer</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-encre-2">
              Le code et le script de collecte sont publics. Les erreurs, les imprécisions de
              vocabulaire et les propositions de lecture sont les bienvenues.
            </p>
            <p className="mt-3 text-[13px]">
              <a
                href="https://github.com/vdcmathieu/mouvementdargent"
                className="lien hover:text-encre"
              >
                github.com/vdcmathieu/mouvementdargent
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
