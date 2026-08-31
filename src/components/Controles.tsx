"use client";

import { useEffect, useRef } from "react";
import { LIBELLES_UNITES, UNITES, type Unite } from "@/lib/format";
import type { Mode } from "@/lib/types";

/**
 * La barre de réglages. Elle reste visible pendant qu'on descend la page :
 * l'année et l'unité valent pour toutes les sections à la fois, il faut
 * pouvoir en changer sans remonter.
 */
export default function Controles({
  annee,
  annees,
  anneesCompletes,
  onAnnee,
  mode,
  onMode,
  detailFonction,
  unite,
  onUnite,
  chargement,
}: {
  annee: number;
  annees: number[];
  anneesCompletes: ReadonlySet<number>;
  onAnnee: (a: number) => void;
  mode: Mode;
  onMode: (m: Mode) => void;
  /** Faux quand l'année choisie n'a pas encore de ventilation par fonction. */
  detailFonction: boolean;
  unite: Unite;
  onUnite: (u: Unite) => void;
  chargement: boolean;
}) {
  const bande = useRef<HTMLDivElement>(null);

  // La bande d'années déborde sur un téléphone : l'année choisie doit être
  // visible sans que l'utilisateur ait à la chercher en faisant défiler.
  useEffect(() => {
    const actif = bande.current?.querySelector('[aria-pressed="true"]');
    actif?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [annee]);

  return (
    <div className="sticky top-0 z-30 border-b border-trait bg-fond/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-2.5 px-5 py-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            ref={bande}
            className="-mx-1 flex min-w-0 gap-0.5 overflow-x-auto px-1 [mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-12px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Choisir l'année"
          >
            {annees.map((a) => {
              const complet = anneesCompletes.has(a);
              const actif = a === annee;
              return (
                <button
                  key={a}
                  onClick={() => onAnnee(a)}
                  aria-pressed={actif}
                  title={
                    complet
                      ? `Comptes ${a}`
                      : `${a} : les agrégats sont publiés, pas encore le détail par fonction`
                  }
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] tabular-nums transition-colors ${
                    actif
                      ? "bg-bleu font-semibold text-white"
                      : complet
                        ? "text-encre-2 hover:bg-fond-2 hover:text-encre"
                        : "text-encre-3 hover:bg-fond-2"
                  }`}
                >
                  {a}
                  {complet ? "" : "*"}
                </button>
              );
            })}
          </div>
          {chargement ? (
            <span className="shrink-0 text-[12px] text-encre-3" role="status">
              …
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Groupe legende="Lecture des dépenses">
            <Pilule
              actif={mode === "fonction" && detailFonction}
              onClick={() => onMode("fonction")}
              inactif={!detailFonction}
              titre={
                detailFonction
                  ? undefined
                  : "Le détail par fonction de cette année n'est pas encore publié"
              }
            >
              À quoi ça sert
            </Pilule>
            <Pilule actif={mode === "nature"} onClick={() => onMode("nature")}>
              Sous quelle forme
            </Pilule>
          </Groupe>

          <Groupe legende="Unité">
            {UNITES.map((u) => (
              <Pilule
                key={u}
                actif={unite === u}
                onClick={() => onUnite(u)}
                titre={LIBELLES_UNITES[u].aide}
              >
                {LIBELLES_UNITES[u].court}
              </Pilule>
            ))}
          </Groupe>
        </div>
      </div>
    </div>
  );
}

function Groupe({ legende, children }: { legende: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={legende}>
      <div className="flex rounded-full border border-trait bg-fond-2 p-0.5">{children}</div>
    </div>
  );
}

function Pilule({
  actif,
  onClick,
  titre,
  inactif = false,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  titre?: string;
  /** Le choix existe mais les données de l'année ne le permettent pas. */
  inactif?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={actif}
      title={titre}
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
        actif
          ? "bg-encre text-fond shadow-sm"
          : inactif
            ? "text-encre-3 line-through decoration-encre-3/60"
            : "text-encre-2 hover:text-encre"
      }`}
    >
      {children}
    </button>
  );
}
