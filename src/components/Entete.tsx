"use client";

import Link from "next/link";
import { euros, milliards, pourcent } from "@/lib/format";
import type { Annee } from "@/lib/types";

const SOMMAIRE = [
  { href: "#flux", texte: "Le mouvement" },
  { href: "#detail", texte: "Poste par poste" },
  { href: "#administrations", texte: "Qui dépense" },
  { href: "#trajectoire", texte: "La trajectoire" },
  { href: "#retenir", texte: "À retenir" },
];

/**
 * Le titre porte le chiffre de l'année sélectionnée. Il suit donc le
 * sélecteur : une page qui annonce 2024 en haut et affiche 2025 en dessous
 * n'inspire aucune confiance, et c'est bien le seul capital de ce site.
 */
export default function Entete({ donnees, maj }: { donnees: Annee; maj: string }) {
  const { agregats, meta } = donnees;

  return (
    <header className="border-b border-trait">
      <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-7 sm:pt-9">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-encre-2">
            Mouvement d&apos;argent
          </span>
          <nav className="flex shrink-0 gap-5 text-[13px] text-encre-2">
            <Link href="/methodologie" className="lien hover:text-encre">
              Méthode et limites
            </Link>
            <a
              href="https://github.com/vdcmathieu/mouvementdargent"
              className="lien hover:text-encre"
            >
              Code et données
            </a>
          </nav>
        </div>

        <h1 className="mt-7 max-w-[19ch] font-titre text-[2.05rem] leading-[1.08] tracking-[-0.02em] sm:text-[3.2rem] lg:text-[4rem]">
          En {meta.annee}, la France a dépensé{" "}
          <span className="text-bleu tabular-nums">{milliards(agregats.depenses)}</span>{" "}
          d&apos;argent public.
        </h1>

        <p className="mt-5 max-w-[62ch] text-[16px] leading-relaxed text-encre-2 sm:text-[17px]">
          Soit {milliards(agregats.depenses / 365)} par jour, ou{" "}
          <span className="font-medium text-encre">
            {euros((agregats.depenses * 1e6) / agregats.population)}
          </span>{" "}
          par habitant. Voici d&apos;où vient cet argent et où il va, à l&apos;échelle, sans rien
          arrondir en chemin.
        </p>

        <nav aria-label="Sommaire" className="mt-7 flex flex-wrap gap-x-1 gap-y-1.5 text-[13px]">
          {SOMMAIRE.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="rounded-full border border-trait px-3 py-1 text-encre-2 transition-colors hover:border-encre hover:text-encre"
            >
              {s.texte}
            </a>
          ))}
        </nav>

        <p className="mt-6 text-[12.5px] leading-relaxed text-encre-3">
          Comptes nationaux des administrations publiques · Insee, via Eurostat · mis à jour le{" "}
          {maj}
          {agregats.partPib ? ` · ${pourcent(agregats.partPib)} du PIB` : ""} · toutes les valeurs
          sont vérifiables poste par poste.
        </p>
      </div>
    </header>
  );
}
