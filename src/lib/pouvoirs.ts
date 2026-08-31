/**
 * Ce que coûtent les institutions élues.
 *
 * C'est la seule partie du site qui ne vient pas des comptes nationaux, et
 * c'est délibéré : la comptabilité nationale ne distingue nulle part les élus
 * des agents. La CFAP s'arrête au groupe 01.1, qui réunit dans un même montant
 * la direction politique, l'administration fiscale et la diplomatie. Aucune
 * clé de répartition n'est publiée, donc rien ne permet d'en extraire les
 * pouvoirs publics — ni ici, ni ailleurs.
 *
 * Les montants ci-dessous sont donc saisis à la main, un par un, depuis des
 * documents officiels français. Chacun porte son lien et sa date. Rien n'est
 * calculé, actualisé ou reconstitué : ce qui est écrit ici est ce qui est
 * écrit là-bas. En contrepartie, ces chiffres ne se mettent pas à jour tout
 * seuls quand une nouvelle loi de finances paraît — d'où la date affichée à
 * côté de chaque bloc.
 *
 * Ces montants sont en euros, pas en millions : ils cohabitent sur la même
 * page avec des milliards, et l'écart d'échelle est précisément ce qu'il y a
 * à voir.
 */

export type Source = {
  titre: string;
  url: string;
  /** Date à laquelle la page a été relevée, au format lisible. */
  releveLe: string;
};

export type Dotation = {
  code: string;
  nom: string;
  /** En euros. */
  montant: number;
  note?: string;
};

export type Exercice = {
  annee: number;
  intitule: string;
  /** Fait notable établi par la source, quand il y en a un. */
  note?: string;
  /** En euros, tel que publié — jamais recalculé depuis les dotations. */
  total: number;
  dotations: Dotation[];
  source: Source;
};

/**
 * La mission « Pouvoirs publics » du budget de l'État. Elle porte les six
 * institutions qui ne relèvent d'aucun ministère : l'exécutif au sommet, les
 * deux assemblées, leur chaîne de télévision et les deux juridictions
 * constitutionnelles.
 *
 * Les dotations sont votées, pas exécutées : c'est ce que le Parlement
 * autorise, à quelques dizaines de milliers d'euros près de ce qui est
 * effectivement dépensé.
 */
export const MISSION_POUVOIRS_PUBLICS: Exercice[] = [
  {
    annee: 2024,
    intitule: "Loi de finances initiale pour 2024",
    total: 1_137_842_143,
    dotations: [
      { code: "511", nom: "Assemblée nationale", montant: 607_647_569 },
      { code: "521", nom: "Sénat", montant: 353_470_900 },
      { code: "501", nom: "Présidence de la République", montant: 122_563_852 },
      {
        code: "541",
        nom: "La Chaîne parlementaire",
        montant: 35_245_822,
        note: "LCP-Assemblée nationale et Public Sénat.",
      },
      { code: "531", nom: "Conseil constitutionnel", montant: 17_930_000 },
      { code: "533", nom: "Cour de justice de la République", montant: 984_000 },
    ],
    source: {
      titre:
        "Sénat, rapport général n° 144 (2024-2025) sur le projet de loi de finances pour 2025, mission « Pouvoirs publics »",
      url: "https://www.senat.fr/rap/l24-144-323/l24-144-323_mono.html",
      releveLe: "31 août 2026",
    },
  },
  {
    annee: 2025,
    intitule: "Loi de finances initiale pour 2025",
    note: "Les présidents des deux assemblées et la Présidence de la République ont renoncé aux hausses demandées : les six dotations sont reconduites à l'euro près sur celles de 2024.",
    total: 1_137_842_143,
    dotations: [
      { code: "511", nom: "Assemblée nationale", montant: 607_647_569 },
      { code: "521", nom: "Sénat", montant: 353_470_900 },
      { code: "501", nom: "Présidence de la République", montant: 122_563_852 },
      { code: "541", nom: "La Chaîne parlementaire", montant: 35_245_822 },
      { code: "531", nom: "Conseil constitutionnel", montant: 17_930_000 },
      { code: "533", nom: "Cour de justice de la République", montant: 984_000 },
    ],
    source: {
      titre:
        "Sénat, rapport général n° 139 (2025-2026) sur le projet de loi de finances pour 2026, mission « Pouvoirs publics »",
      url: "https://www.senat.fr/rap/l25-139-322/l25-139-322_mono.html",
      releveLe: "31 août 2026",
    },
  },
];

/**
 * L'indemnité parlementaire. Elle est identique pour un député et pour un
 * sénateur au brut : le même texte la fixe pour les deux chambres. Le net
 * diffère parce que la cotisation de retraite n'est pas la même de part et
 * d'autre.
 */
export const INDEMNITE_PARLEMENTAIRE = {
  dateEffet: "1ᵉʳ janvier 2024",
  brut: 7_637.39,
  composantes: [
    { libelle: "Indemnité parlementaire de base", montant: 5_931.95 },
    { libelle: "Indemnité de résidence (3 %)", montant: 177.96 },
    { libelle: "Indemnité de fonction (25 %)", montant: 1_527.48 },
  ],
  net: [
    {
      chambre: "Député",
      montant: 5_953.34,
      source: {
        titre: "Assemblée nationale, fiche de synthèse n° 7 — La situation matérielle du député",
        url: "https://www.assemblee-nationale.fr/dyn/synthese/deputes-groupes-parlementaires/la-situation-materielle-du-depute",
        releveLe: "31 août 2026",
      } satisfies Source,
    },
    {
      chambre: "Sénateur",
      montant: 5_676.12,
      source: {
        titre: "Sénat, L'indemnité parlementaire",
        url: "https://www.senat.fr/connaitre-le-senat/role-et-fonctionnement/lindemnite-parlementaire.html",
        releveLe: "31 août 2026",
      } satisfies Source,
    },
  ],
};

/**
 * Ce qui n'est pas une rémunération, et qu'on confond systématiquement avec
 * elle. Ces deux enveloppes ne sont pas un revenu : la première rembourse des
 * frais de mandat, la seconde paie les salaires d'autres personnes. Les
 * afficher à côté de l'indemnité évite d'additionner des choses différentes.
 */
export const ENVELOPPES_DEPUTE = [
  {
    libelle: "Dotation de fonctionnement parlementaire",
    montant: 7_238.04,
    dateEffet: "1ᵉʳ janvier 2026",
    note: "Frais de mandat d'un député élu en métropole. Ce n'est pas un revenu : les dépenses doivent être justifiées.",
  },
  {
    libelle: "Crédit collaborateurs",
    montant: 11_463,
    dateEffet: "montant en vigueur à la date de relevé",
    note: "Enveloppe qui paie jusqu'à cinq collaborateurs. Elle ne transite pas par le revenu du député.",
  },
];

/**
 * Le traitement du Président de la République et des ministres n'existe nulle
 * part comme un montant publié : le décret le définit par une formule indexée
 * sur la grille hors échelle de la fonction publique. On le dit plutôt que
 * d'afficher un chiffre reconstitué.
 */
export const TRAITEMENT_EXECUTIF = {
  source: {
    titre:
      "Décret n° 2012-983 du 23 août 2012 relatif au traitement du Président de la République et des membres du Gouvernement",
    url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000026310466",
    releveLe: "31 août 2026",
  } satisfies Source,
};

/** L'exercice à montrer pour une année donnée, ou le plus récent disponible. */
export function exercicePour(annee: number): Exercice {
  return (
    MISSION_POUVOIRS_PUBLICS.find((e) => e.annee === annee) ??
    MISSION_POUVOIRS_PUBLICS[MISSION_POUVOIRS_PUBLICS.length - 1]
  );
}
