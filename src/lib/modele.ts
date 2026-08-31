import type { Annee, Mode, Poste } from "./types";
import { eclaircir, teinte, EST_PRELEVEMENT } from "./palette";
import { libelleCourt } from "./libelles";

export type Famille = "prelevement" | "ressource" | "emprunt" | "tronc" | "emploi";

export type Noeud = {
  id: string;
  libelle: string;
  /** Libellé d'origine de la source, quand on l'a raccourci pour l'affichage. */
  libelleOfficiel?: string;
  /** Le grand poste dont ce nœud dépend (lui-même s'il est déjà de premier niveau). */
  parent: string;
  cote: "source" | "tronc" | "emploi";
  famille: Famille;
  montant: number;
  couleur: string;
  note?: string;
  /** Vrai si le nœud peut être ouvert pour révéler son détail. */
  depliable: boolean;
  /** Vrai si l'on regarde déjà son détail. */
  deplie: boolean;
  /** Part des dépenses totales. */
  part: number;
};

export type Lien = { source: string; cible: string; valeur: number; couleur: string };

export type Graphe = { noeuds: Noeud[]; liens: Lien[]; total: number };

/** En dessous de ce seuil, un sous-poste est regroupé pour rester lisible. */
const SEUIL_REGROUPEMENT = 0.004;

const TRONC = "APU";

function regrouper(postes: Poste[], total: number): Poste[] {
  const gardes = postes.filter((p) => Math.abs(p.montant) >= total * SEUIL_REGROUPEMENT);
  const petits = postes.filter((p) => Math.abs(p.montant) < total * SEUIL_REGROUPEMENT);
  if (petits.length <= 1) return postes;
  const reste = petits.reduce((a, p) => a + p.montant, 0);
  return [...gardes, { code: "RESTE", libelle: `Autres (${petits.length} postes)`, montant: reste }];
}

/**
 * Construit le graphe affiché à partir des données de l'année et de ce que
 * l'utilisateur a déplié. Le tronc central porte le total des dépenses : à
 * gauche les ressources (recettes + emprunt), à droite les emplois.
 */
export function construireGraphe(
  donnees: Annee,
  mode: Mode,
  deplies: ReadonlySet<string>,
): Graphe {
  const { agregats } = donnees;
  const total = agregats.depenses;
  const noeuds: Noeud[] = [];
  const liens: Lien[] = [];

  const emplois = mode === "fonction" ? donnees.fonctions : donnees.natures;

  const ajouter = (groupe: Poste, cote: "source" | "emploi", signe: 1 | -1) => {
    const base = teinte(groupe.code);
    const ouvert = deplies.has(groupe.code) && (groupe.postes?.length ?? 0) > 1;
    const famille: Famille =
      cote === "emploi" ? "emploi" : EST_PRELEVEMENT.has(groupe.code) ? "prelevement" : "ressource";

    if (!ouvert) {
      noeuds.push({
        id: groupe.code,
        libelle: libelleCourt(groupe.code, groupe.libelle),
        libelleOfficiel: groupe.libelle,
        parent: groupe.code,
        cote,
        famille,
        montant: groupe.montant,
        couleur: base,
        note: groupe.note,
        depliable: (groupe.postes?.length ?? 0) > 1,
        deplie: false,
        part: groupe.montant / total,
      });
      liens.push(
        signe === 1
          ? { source: groupe.code, cible: TRONC, valeur: groupe.montant, couleur: base }
          : { source: TRONC, cible: groupe.code, valeur: groupe.montant, couleur: base },
      );
      return;
    }

    const sous = regrouper(groupe.postes!, total);
    sous.forEach((p, i) => {
      const couleur = eclaircir(base, (i / Math.max(sous.length - 1, 1)) * 0.5);
      const id = `${groupe.code}/${p.code}`;
      noeuds.push({
        id,
        libelle: libelleCourt(p.code, p.libelle),
        libelleOfficiel: p.libelle,
        parent: groupe.code,
        cote,
        famille,
        montant: p.montant,
        couleur,
        depliable: false,
        deplie: true,
        part: p.montant / total,
      });
      liens.push(
        signe === 1
          ? { source: id, cible: TRONC, valeur: p.montant, couleur }
          : { source: TRONC, cible: id, valeur: p.montant, couleur },
      );
    });
  };

  for (const r of donnees.recettes) ajouter(r, "source", 1);

  // L'écart entre recettes et dépenses est comblé par l'emprunt : c'est une
  // ressource comme une autre, et il faut la voir.
  if (agregats.solde < 0) {
    const montant = -agregats.solde;
    noeuds.push({
      id: "EMPRUNT",
      libelle: "Emprunt (déficit)",
      parent: "EMPRUNT",
      cote: "source",
      famille: "emprunt",
      montant,
      couleur: teinte("EMPRUNT"),
      note: "La part des dépenses qui n'est pas couverte par des recettes. Elle est empruntée sur les marchés et s'ajoute à la dette publique.",
      depliable: false,
      deplie: false,
      part: montant / total,
    });
    liens.push({ source: "EMPRUNT", cible: TRONC, valeur: montant, couleur: teinte("EMPRUNT") });
  }

  noeuds.push({
    id: TRONC,
    libelle: `Dépense publique ${donnees.meta.annee}`,
    parent: TRONC,
    cote: "tronc",
    famille: "tronc",
    montant: total,
    couleur: teinte("APU"),
    depliable: false,
    deplie: false,
    part: 1,
  });

  for (const e of emplois) ajouter(e, "emploi", -1);

  // Un solde excédentaire irait vers le désendettement : cas d'école en France,
  // mais le modèle doit rester juste.
  if (agregats.solde > 0) {
    const couleur = teinte("DESENDETTEMENT");
    noeuds.push({
      id: "DESENDETTEMENT",
      libelle: "Réduction de la dette",
      parent: "DESENDETTEMENT",
      cote: "emploi",
      famille: "emploi",
      montant: agregats.solde,
      couleur,
      depliable: false,
      deplie: false,
      part: agregats.solde / total,
    });
    liens.push({ source: TRONC, cible: "DESENDETTEMENT", valeur: agregats.solde, couleur });
  }

  return { noeuds, liens, total };
}

/* ------------------------------------------------------------------ *
 * Le même contenu, en liste classée.
 *
 * Le diagramme montre les proportions ; la liste se lit sur un téléphone,
 * se parcourt au clavier et tient lieu de vue tabulaire. Les deux sont
 * construits à partir des mêmes postes, sans arrondi intermédiaire.
 * ------------------------------------------------------------------ */

export type Rang = {
  code: string;
  libelle: string;
  libelleOfficiel?: string;
  montant: number;
  part: number;
  couleur: string;
  note?: string;
  /** Répartition entre administrations, non consolidée, quand la source la donne. */
  parSecteur?: Record<string, number>;
  sous: Omit<Rang, "sous" | "parSecteur">[];
};

/**
 * Les ressources de l'année : les recettes, plus l'emprunt qui comble l'écart.
 * La colonne doit totaliser exactement la dépense, comme le côté gauche du
 * diagramme — sans quoi les deux vues ne racontent pas la même chose.
 */
export function classerRessources(donnees: Annee): Rang[] {
  const total = donnees.agregats.depenses;
  const rangs = classer(donnees.recettes, total);
  if (donnees.agregats.solde >= 0) return rangs;
  const montant = -donnees.agregats.solde;
  return [
    ...rangs,
    {
      code: "EMPRUNT",
      libelle: "Emprunt (déficit)",
      montant,
      part: montant / total,
      couleur: teinte("EMPRUNT"),
      note: "La part des dépenses qui n'est pas couverte par des recettes. Elle est empruntée sur les marchés et s'ajoute à la dette publique.",
      sous: [],
    },
  ].sort((a, b) => b.montant - a.montant);
}

export function classer(postes: Poste[], total: number): Rang[] {
  return [...postes]
    .sort((a, b) => b.montant - a.montant)
    .map((p) => {
      const base = teinte(p.code);
      const sous = regrouper(p.postes ?? [], total)
        .sort((a, b) => b.montant - a.montant)
        .map((s, i, tab) => ({
          code: `${p.code}/${s.code}`,
          libelle: libelleCourt(s.code, s.libelle),
          libelleOfficiel: s.libelle,
          montant: s.montant,
          part: s.montant / total,
          couleur: eclaircir(base, (i / Math.max(tab.length - 1, 1)) * 0.5),
        }));
      return {
        code: p.code,
        libelle: libelleCourt(p.code, p.libelle),
        libelleOfficiel: p.libelle,
        montant: p.montant,
        part: p.montant / total,
        couleur: base,
        note: p.note,
        parSecteur: p.parSecteur,
        sous: sous.length > 1 ? sous : [],
      };
    });
}
