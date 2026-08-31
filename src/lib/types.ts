export type Poste = {
  code: string;
  libelle: string;
  montant: number;
  note?: string;
  postes?: Poste[];
  parSecteur?: Record<string, number>;
};

export type Secteur = { nom: string; court: string; description: string };

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
  }[];
};

/** Ce que l'on montre à droite du graphique. */
export type Mode = "fonction" | "nature";
