/**
 * Une teinte par grand poste. Les sous-postes héritent de la teinte du parent
 * en variant la luminosité : la couleur reste une information, jamais une
 * décoration.
 */
export const TEINTES: Record<string, string> = {
  // Recettes — famille froide.
  COTIS: "#1f5f8b",
  REVENU: "#2b7a9b",
  CONSO: "#2d8f8a",
  PROD: "#4a6b8a",
  CAPITAL: "#5b8ca8",
  VENTES: "#6d8f9e",
  PATRIMOINE: "#7c96a3",
  AUTRES_REC: "#93a3ac",
  // Le financement par emprunt, à part.
  EMPRUNT: "#c0392b",
  // Le tronc.
  APU: "#3d3730",

  // Dépenses par fonction — famille chaude et contrastée.
  GF10: "#6b4c9a",
  GF07: "#2e8b73",
  GF01: "#7a6a5d",
  GF04: "#c8862a",
  GF09: "#2f6fb5",
  GF08: "#b5568c",
  GF02: "#6e7b3f",
  GF03: "#4a7fa0",
  GF06: "#a86242",
  GF05: "#4f9a4a",

  // Dépenses par nature.
  PRESTA_ESPECES: "#6b4c9a",
  PRESTA_NATURE: "#2e8b73",
  SALAIRES: "#c8862a",
  FONCTIONNEMENT: "#a86242",
  INVEST: "#2f6fb5",
  SUBVENTIONS: "#b5568c",
  INTERETS: "#c0392b",
  TRANSFERTS: "#6e7b3f",
  AUTRES_DEP: "#8d8880",
};

const DEFAUT = "#8d8880";

export function teinte(code: string): string {
  return TEINTES[code] ?? DEFAUT;
}

/** Éclaircit une couleur hex vers le fond, pour les sous-postes. */
export function eclaircir(hex: string, facteur: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * facteur);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
