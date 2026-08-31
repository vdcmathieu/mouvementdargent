/** Les montants manipulés sont en millions d'euros courants. */

/**
 * Intl place une espace fine insécable (U+202F) comme séparateur de milliers.
 * Plusieurs polices système la rendent à largeur nulle : « 21862 » au lieu de
 * « 21 862 ». On repasse donc sur une espace insécable ordinaire.
 */
const lisible = (s: string) => s.replace(/ /g, " ");

const nf = (d: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** 206332 → « 206,3 Md€ ». En dessous du milliard, on bascule en millions. */
export function milliards(mEuros: number, precision?: number): string {
  const md = mEuros / 1000;
  if (Math.abs(md) < 1) return lisible(`${nf(0).format(Math.round(mEuros))} M€`);
  // Une décimale partout au-dessus du milliard : deux décimales sur les petits
  // postes désalignaient les colonnes de chiffres pour un gain de précision nul.
  return lisible(`${nf(precision ?? 1).format(md)} Md€`);
}

/** Montant ramené à un habitant, l'unité qui parle vraiment. */
export function parHabitant(mEuros: number, population: number): string {
  if (!population) return "—";
  return euros((mEuros * 1e6) / population);
}

export function pourcent(part: number, precision = 1): string {
  return lisible(`${nf(precision).format(part * 100)} %`);
}

export function euros(v: number): string {
  return lisible(`${nf(0).format(Math.round(v))} €`);
}

export function eurosPrecis(v: number, decimales = 2): string {
  return lisible(`${nf(decimales).format(v)} €`);
}

export function entier(v: number): string {
  return lisible(nf(0).format(Math.round(v)));
}

/* ------------------------------------------------------------------ *
 * Les quatre façons de lire un même montant.
 *
 * Un milliard d'euros ne veut rien dire pour personne. Les trois autres
 * unités sont des transformations exactes du montant publié — jamais une
 * estimation : on divise par la population publiée, ou par le total de
 * l'année. Le choix vaut pour toute la page à la fois.
 * ------------------------------------------------------------------ */

export const UNITES = ["milliards", "habitant", "mille", "part"] as const;
export type Unite = (typeof UNITES)[number];

export type Bareme = { total: number; population: number };

export const LIBELLES_UNITES: Record<
  Unite,
  { court: string; long: string; aide: string }
> = {
  milliards: {
    court: "Milliards",
    long: "En milliards d'euros",
    aide: "Le montant publié, tel quel.",
  },
  habitant: {
    court: "Par habitant",
    long: "En euros par habitant",
    aide: "Le montant divisé par la population de l'année.",
  },
  mille: {
    court: "Pour 1 000 €",
    long: "Pour 1 000 € de dépense publique",
    aide: "La part du poste appliquée à une dépense de 1 000 €.",
  },
  part: {
    court: "En %",
    long: "En part du total",
    aide: "La part du poste dans le total de l'année.",
  },
};

/** Formate un montant dans l'unité choisie. */
export function formater(mEuros: number, unite: Unite, bareme: Bareme): string {
  switch (unite) {
    case "milliards":
      return milliards(mEuros);
    case "habitant":
      return parHabitant(mEuros, bareme.population);
    case "mille":
      return bareme.total ? euros((mEuros / bareme.total) * 1000) : "—";
    case "part":
      return bareme.total ? pourcent(mEuros / bareme.total) : "—";
  }
}

/** Version compacte pour une étiquette serrée du diagramme. */
export function formaterCourt(mEuros: number, unite: Unite, bareme: Bareme): string {
  if (unite !== "milliards") return formater(mEuros, unite, bareme);
  const md = mEuros / 1000;
  if (Math.abs(md) < 1) return lisible(`${nf(0).format(Math.round(mEuros))} M€`);
  return lisible(`${nf(Math.abs(md) >= 100 ? 0 : 1).format(md)} Md€`);
}
