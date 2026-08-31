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
  const d = precision ?? (Math.abs(md) >= 10 ? 1 : 2);
  return lisible(`${nf(d).format(md)} Md€`);
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
