/**
 * Les teintes de données.
 *
 * Règle de lecture : le bleu, c'est l'argent qui entre ; le rouge, ce qui
 * manque ; l'encre, le total. Les emplois portent une famille chaude et
 * variée, jamais bleue — pour qu'un ruban dise de quel côté il est avant même
 * qu'on lise son étiquette.
 *
 * Ces valeurs ne sont pas choisies à l'œil. Elles sortent d'une recherche sous
 * contrainte (bande de luminosité OKLCH 0,43–0,77, chroma ≥ 0,10, contraste
 * ≥ 3:1 sur le fond crème, séparation ΔE ≥ 8 en deutéranopie et ≥ 15 en vision
 * normale entre teintes voisines dans l'ordre d'empilement). Changer une teinte
 * sans revalider casse la lisibilité pour les 8 % d'hommes daltoniens.
 */

/** Les deux rampes des ressources : plus le poste est gros, plus il est foncé. */
const PRELEVEMENTS = ["#063898", "#204ea7", "#3763b6", "#4e78c5"];
const AUTRES_RESSOURCES = ["#00656f", "#007981", "#008e95", "#1aa2a9"];

export const TEINTES: Record<string, string> = {
  // Ressources — prélèvements obligatoires, du plus lourd au plus léger.
  COTIS: PRELEVEMENTS[0],
  REVENU: PRELEVEMENTS[1],
  CONSO: PRELEVEMENTS[2],
  PROD: PRELEVEMENTS[3],
  // Ressources — ce qui n'est pas un prélèvement obligatoire.
  VENTES: AUTRES_RESSOURCES[0],
  CAPITAL: AUTRES_RESSOURCES[1],
  PATRIMOINE: AUTRES_RESSOURCES[2],
  AUTRES_REC: AUTRES_RESSOURCES[3],

  // Ce qui n'est pas financé : l'emprunt.
  EMPRUNT: "#b01b2e",
  // Le tronc.
  APU: "#1c2027",
  // Le cas d'école inverse.
  DESENDETTEMENT: "#227f53",

  // Emplois par fonction, dans l'ordre d'empilement habituel.
  GF10: "#8a3aa0",
  GF07: "#227f53",
  GF01: "#874805",
  GF04: "#b07a00",
  GF09: "#079b8b",
  GF02: "#3e5e0e",
  GF03: "#bf4b96",
  GF08: "#c34517",
  GF06: "#8a6ee2",
  GF05: "#7b6c01",

  // Emplois par nature, dans l'ordre d'empilement habituel.
  PRESTA_ESPECES: "#3e5e0e",
  SALAIRES: "#b07a00",
  PRESTA_NATURE: "#8a3aa0",
  FONCTIONNEMENT: "#874805",
  TRANSFERTS: "#8a6ee2",
  INVEST: "#079b8b",
  INTERETS: "#b01b2e",
  SUBVENTIONS: "#bf4b96",
  AUTRES_DEP: "#7b6c01",
};

/**
 * Les trois administrations. Ce trio est validé sur toutes les paires (et pas
 * seulement sur les voisines) : dans une barre empilée à trois segments,
 * n'importe lesquels peuvent se toucher.
 */
export const TEINTES_SECTEURS: Record<string, string> = {
  S1311: "#204ea7",
  S1313: "#008e95",
  S1314: "#b07a00",
};

const DEFAUT = "#8a8e99";

export function teinte(code: string): string {
  return TEINTES[code] ?? DEFAUT;
}

/** Les codes dont l'argent entre : ils portent le bleu ou le bleu-vert. */
export const EST_PRELEVEMENT = new Set(["COTIS", "REVENU", "CONSO", "PROD"]);

/**
 * Éclaircit une couleur vers le fond, pour les sous-postes d'un même parent.
 * Le facteur reste borné à 0,55 : au-delà, le sous-poste le plus clair ne tient
 * plus le contraste minimal sur le papier.
 */
export function eclaircir(hex: string, facteur: number): string {
  const f = Math.min(Math.max(facteur, 0), 0.55);
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * f);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Voile très clair d'une teinte, pour un fond de ligne ou une pastille. Ce
 * n'est jamais une marque de données : le contraste minimal ne s'y applique
 * pas, mais rien de lisible ne doit reposer dessus seul.
 */
export function voile(hex: string, facteur = 0.9): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * facteur);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
