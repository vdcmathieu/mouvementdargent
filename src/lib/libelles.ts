/**
 * Les libellés officiels d'Eurostat sont parfois trop longs ou trop
 * administratifs pour tenir dans une étiquette et parler à tout le monde.
 * On les raccourcit à l'affichage — le libellé d'origine reste dans les
 * données publiées et apparaît dans l'infobulle.
 */
const COURTS: Record<string, string> = {
  GF01: "Services généraux de l'État",
  GF0101: "Exécutif, législatif, finances publiques",
  GF0102: "Aide économique extérieure",
  GF0107: "Charge de la dette",
  GF0105: "R & D des services généraux",
  GF06: "Logement et équipements collectifs",
  GF0701: "Médicaments et matériel médical",
  GF0702: "Soins de ville",
  GF0703: "Hôpital",
  GF0704: "Santé publique et prévention",
  GF0705: "Recherche médicale",
  GF1001: "Maladie et invalidité",
  GF1002: "Vieillesse (retraites)",
  GF0409: "Autres affaires économiques",
  GF1007: "Lutte contre l'exclusion",
  GF1009: "Protection sociale (autres)",
  GF0706: "Santé (autres)",
};

export function libelleCourt(code: string, officiel: string): string {
  if (COURTS[code]) return COURTS[code];
  // « n.c.a. » signifie « non classé ailleurs » : incompréhensible hors du
  // vocabulaire de la comptabilité nationale.
  return officiel.replace(/\s*n\.c\.a\.\s*$/i, " (autres)").replace(/^R & D/, "Recherche");
}
