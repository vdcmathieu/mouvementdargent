import type { Metadata } from "next";
import "./globals.css";

const titre = "Mouvement d'argent — où va l'argent public en France";
const description =
  "D'où vient l'argent public français et où il va, poste par poste, à partir des comptes nationaux publiés par l'Insee. Un diagramme de flux interactif, avec les sources.";

/** Renseigner NEXT_PUBLIC_SITE_URL une fois le domaine définitif en place. */
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
      <body>{children}</body>
    </html>
  );
}
