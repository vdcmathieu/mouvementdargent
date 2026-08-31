import Explorateur from "@/components/Explorateur";
import { lireAnnee, lireIndex } from "@/lib/donnees";
import { milliards } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-static";

export default async function Page() {
  const index = await lireIndex();
  const donnees = await lireAnnee(index.anneeParDefaut);
  const maj = new Date(index.misAJourParEurostat).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main>
      <header className="border-b border-trait">
        <div className="mx-auto max-w-[1180px] px-6 pb-9 pt-10 sm:pt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
            <h1 className="font-titre text-[2.1rem] leading-none tracking-[-0.015em] sm:text-[2.6rem]">
              Mouvement d&apos;argent
            </h1>
            <nav className="flex shrink-0 gap-5 text-[13.5px] text-ink-doux">
              <Link href="/methodologie" className="underline decoration-trait underline-offset-4 hover:text-ink">
                Méthode
              </Link>
              <a
                href="https://github.com/vdcmathieu/mouvementdargent"
                className="underline decoration-trait underline-offset-4 hover:text-ink"
              >
                Code source
              </a>
            </nav>
          </div>
          <p className="mt-4 max-w-[62ch] text-[16.5px] leading-relaxed text-ink-doux">
            En {donnees.meta.annee}, la France a dépensé{" "}
            <span className="font-medium text-ink">
              {milliards(donnees.agregats.depenses, 0)}
            </span>{" "}
            d&apos;argent public, soit {milliards(donnees.agregats.depenses / 365, 1)} par jour.
            Voici d&apos;où vient cet argent et où il va, à l&apos;échelle, sans rien arrondir en
            chemin.
          </p>
          <p className="mt-3 text-[13px] text-ink-doux">
            Comptes nationaux des administrations publiques · Insee, via Eurostat · mis à jour le{" "}
            {maj}
          </p>
        </div>
      </header>

      <Explorateur initiale={donnees} index={index} />

      <footer className="mt-20 border-t border-trait bg-paper-2">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-12 md:grid-cols-3">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.09em]">Les données</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-doux">
              Comptes nationaux annuels des administrations publiques, produits par l&apos;Insee
              selon le SEC 2010 et diffusés par Eurostat. Aucun chiffre n&apos;est estimé ni
              réparti au jugé.
            </p>
            <ul className="mt-3 space-y-1 text-[13px]">
              {donnees.meta.sources.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    className="underline decoration-trait underline-offset-4 hover:text-ink"
                  >
                    {s.id}
                  </a>{" "}
                  <span className="text-ink-doux">— {s.titre}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.09em]">
              Reprendre les données
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-doux">
              Tout le jeu de données consolidé est téléchargeable en JSON, une année par fichier.
            </p>
            <ul className="mt-3 space-y-1 text-[13px]">
              <li>
                <a
                  href={`/data/apu-${donnees.meta.annee}.json`}
                  className="underline decoration-trait underline-offset-4 hover:text-ink"
                >
                  apu-{donnees.meta.annee}.json
                </a>
              </li>
              <li>
                <a
                  href="/data/index.json"
                  className="underline decoration-trait underline-offset-4 hover:text-ink"
                >
                  index.json
                </a>{" "}
                <span className="text-ink-doux">— série {index.annees[0]}–{index.annees.at(-1)}</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.09em]">
              Contribuer
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-doux">
              Le code et le script de collecte sont publics. Les erreurs, les imprécisions de
              vocabulaire et les propositions de lecture sont les bienvenues.
            </p>
            <p className="mt-3 text-[13px]">
              <a
                href="https://github.com/vdcmathieu/mouvementdargent"
                className="underline decoration-trait underline-offset-4 hover:text-ink"
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
