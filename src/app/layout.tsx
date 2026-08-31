import type { Metadata } from "next";
import "./globals.css";

const titre = "Mouvement d'argent — où va l'argent public en France";
const description =
  "D'où vient l'argent public français et où il va, poste par poste, à partir des comptes nationaux publiés par l'Insee. Un diagramme de flux interactif, avec les sources.";

/**
 * Renseigner NEXT_PUBLIC_SITE_URL une fois le domaine définitif en place.
 * On teste la valeur avec `||` et non `??` : sur Vercel une variable définie
 * mais vide vaut "", que `??` laisse passer et que `new URL("")` refuse — le
 * build échoue alors à la collecte des métadonnées. À défaut, on prend le
 * domaine de production fourni par la plateforme, pour que les URL Open Graph
 * soient absolues et justes.
 */
const site =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: titre, template: "%s — Mouvement d'argent" },
  description,
  openGraph: {
    title: titre,
    description,
    locale: "fr_FR",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: titre, description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* Le liseré du haut : la seule décoration de la page, et elle dit de quel pays on parle. */}
        <div className="tricolore h-[3px] w-full" aria-hidden="true" />
        <a
          href="#flux"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-encre focus:px-3 focus:py-2 focus:text-fond"
        >
          Aller au diagramme
        </a>
        {children}
      </body>
    </html>
  );
}
