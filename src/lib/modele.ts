import type { Annee, Mode, Poste } from "./types";
import { eclaircir, teinte } from "./palette";
import { libelleCourt } from "./libelles";

export type Noeud = {
  id: string;
  libelle: string;
  /** Libellé d'origine de la source, quand on l'a raccourci pour l'affichage. */
  libelleOfficiel?: string;
  /** Le grand poste dont ce nœud dépend (lui-même s'il est déjà de premier niveau). */
  parent: string;
  cote: "source" | "tronc" | "emploi";
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

  const ajouter = (
    groupe: Poste,
    cote: "source" | "emploi",
    signe: 1 | -1,
  ) => {
    const base = teinte(groupe.code);
    const ouvert = deplies.has(groupe.code) && (groupe.postes?.length ?? 0) > 1;

    if (!ouvert) {
      noeuds.push({
        id: groupe.code,
        libelle: libelleCourt(groupe.code, groupe.libelle),
        libelleOfficiel: groupe.libelle,
        parent: groupe.code,
        cote,
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
    noeuds.push({
      id: "DESENDETTEMENT",
      libelle: "Réduction de la dette",
      parent: "DESENDETTEMENT",
      cote: "emploi",
      montant: agregats.solde,
      couleur: "#4f9a4a",
      depliable: false,
      deplie: false,
      part: agregats.solde / total,
    });
    liens.push({
      source: TRONC,
      cible: "DESENDETTEMENT",
      valeur: agregats.solde,
      couleur: "#4f9a4a",
    });
  }

  return { noeuds, liens, total };
}
