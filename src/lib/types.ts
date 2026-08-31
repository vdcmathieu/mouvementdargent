export type Poste = {
  code: string;
  libelle: string;
  montant: number;
  note?: string;
  postes?: Poste[];
  parSecteur?: Record<string, number>;
};

export type Secteur = { nom: string; court: string; description: string };

/** Un groupe de la division 01 de la CFAP, avec la part qui le fait tourner. */
export type PosteAdministration = {
  code: string;
  libelle: string;
  montant: number;
  /** Rémunérations + achats + investissement : le coût de fonctionnement propre. */
  fonctionnement: number;
  parSecteur?: Record<string, number>;
};

/**
 * Ce que l'appareil administratif dépense pour lui-même, isolé du reste de la
 * division 01 (dette, recherche fondamentale, aide extérieure). Nul quand la
 * ventilation par fonction de l'année n'est pas encore publiée.
 */
export type Administration = {
  division: { code: string; libelle: string; montant: number };
  interne: {
    montant: number;
    fonctionnement: number;
    postes: PosteAdministration[];
    natures: { code: string; libelle: string; fonctionnement: boolean; montant: number }[];
    parSecteur: Record<string, number>;
  };
  horsInterne: { code: string; libelle: string; montant: number }[];
  remunerations: {
    total: number;
    parFonction: { code: string; libelle: string; montant: number }[];
  };
};

export type Annee = {
  meta: {
    annee: number;
    complet: boolean;
    unite: string;
    genereLe: string;
    misAJourParEurostat: string;
    sources: { id: string; titre: string; url: string }[];
  };
  agregats: {
    recettes: number;
    depenses: number;
    solde: number;
    pib: number;
    population: number;
    partPib: number | null;
    soldePartPib: number | null;
  };
  secteurs: Record<string, Secteur>;
  recettes: Poste[];
  fonctions: Poste[];
  natures: Poste[];
  administrations: (Secteur & { code: string; depenses: number; recettes: number; agents: number })[];
  administration: Administration | null;
};

export type Index = {
  genereLe: string;
  misAJourParEurostat: string;
  annees: number[];
  anneesCompletes: number[];
  anneeParDefaut: number;
  historique: {
    annee: number;
    recettes: number;
    depenses: number;
    solde: number;
    pib: number;
    complet: boolean;
    administration: number | null;
  }[];
};

/** Ce que l'on montre à droite du graphique. */
export type Mode = "fonction" | "nature";
