/**
 * Construit le modèle de flux à partir des comptes nationaux des
 * administrations publiques (Insee, transmis à Eurostat au titre du SEC 2010).
 *
 *   pnpm run data            # dernière année disponible + historique
 *   pnpm run data -- 2023    # une année précise
 *
 * Principe : aucun chiffre n'est inventé. Les totaux proviennent de
 * `gov_10a_main`, les détails de `gov_10a_taxag` et `gov_10a_exp`. Quand le
 * détail ne recouvre pas exactement le total, l'écart est publié tel quel dans
 * un poste « Autres », jamais réparti au prorata.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fetchDataset, flatten, labels, type Obs } from "./eurostat.ts";

const PREMIERE_ANNEE = 2015;
const SECTEURS = ["S13", "S1311", "S1313", "S1314"] as const;

const NOMS_SECTEURS: Record<string, { nom: string; court: string; description: string }> = {
  S13: {
    nom: "Administrations publiques",
    court: "Toutes",
    description: "L'ensemble : État, opérateurs, collectivités et sécurité sociale.",
  },
  S1311: {
    nom: "État et opérateurs",
    court: "État",
    description:
      "L'État au sens strict et les organismes qu'il finance et contrôle (universités, agences, Pôle emploi…).",
  },
  S1313: {
    nom: "Collectivités locales",
    court: "Collectivités",
    description: "Communes, intercommunalités, départements et régions.",
  },
  S1314: {
    nom: "Sécurité sociale",
    court: "Sécurité sociale",
    description:
      "Régimes d'assurance maladie, retraite, famille, chômage, et les hôpitaux publics.",
  },
};

/* ------------------------------------------------------------------ recettes */

type Poste = { code: string; libelle: string; montant: number; postes?: Poste[] };

/** Groupes de recettes, du plus lisible au plus technique. */
const GROUPES_RECETTES: {
  code: string;
  libelle: string;
  note: string;
  total: string; // code na_item dans gov_10a_main
  detail: { code: string; libelle: string }[]; // codes na_item dans gov_10a_taxag
}[] = [
  {
    code: "COTIS",
    libelle: "Cotisations sociales",
    note: "Prélevées sur les salaires, elles financent la retraite, la maladie, la famille et le chômage.",
    total: "D61REC",
    detail: [
      { code: "D611", libelle: "Cotisations employeurs" },
      { code: "D613", libelle: "Cotisations salariés et indépendants" },
      { code: "D612", libelle: "Cotisations imputées (employeurs publics)" },
    ],
  },
  {
    code: "CONSO",
    libelle: "Impôts sur la consommation",
    note: "Payés à chaque achat, ils sont inclus dans les prix affichés.",
    total: "D21REC",
    detail: [
      { code: "D211", libelle: "TVA" },
      { code: "D214A", libelle: "Carburants, alcool et tabac" },
      { code: "D214G", libelle: "Primes d'assurance" },
      { code: "D214C", libelle: "Transactions financières" },
      { code: "D214F", libelle: "Jeux et paris" },
      { code: "D214D", libelle: "Immatriculation des véhicules" },
      { code: "D214H", libelle: "Autres taxes sur services" },
    ],
  },
  {
    code: "REVENU",
    libelle: "Impôts sur le revenu et le patrimoine",
    note: "Prélevés chaque année sur les revenus des ménages et les bénéfices des entreprises.",
    total: "D5REC",
    detail: [
      { code: "D51A_C1", libelle: "Impôt sur le revenu, CSG et CRDS" },
      { code: "D51B_C2", libelle: "Impôt sur les sociétés" },
      { code: "D59", libelle: "Autres impôts courants (dont IFI)" },
    ],
  },
  {
    code: "PROD",
    libelle: "Impôts sur la production",
    note: "Payés par les entreprises et les propriétaires indépendamment de leurs bénéfices.",
    total: "D29REC",
    detail: [
      { code: "D29A", libelle: "Taxes foncières et sur les locaux" },
      { code: "D29C", libelle: "Taxes sur la masse salariale" },
      { code: "D29F", libelle: "Émissions polluantes" },
      { code: "D29H", libelle: "Autres impôts sur la production" },
    ],
  },
  {
    code: "CAPITAL",
    libelle: "Impôts sur le capital",
    note: "Essentiellement les droits de succession et de donation.",
    total: "D91REC",
    detail: [{ code: "D91A", libelle: "Successions et donations" }],
  },
  {
    code: "VENTES",
    libelle: "Ventes et redevances",
    note: "Cantines, crèches, transports, tickets de musée, redevances d'occupation du domaine public…",
    total: "P11_P12_P131",
    detail: [],
  },
  {
    code: "PATRIMOINE",
    libelle: "Revenus du patrimoine",
    note: "Dividendes des entreprises publiques, loyers, intérêts perçus.",
    total: "D4REC",
    detail: [],
  },
];

/* ---------------------------------------------------------------- dépenses */

const GROUPES_NATURE: { code: string; libelle: string; note: string; items: string[] }[] = [
  {
    code: "PRESTA_ESPECES",
    libelle: "Prestations sociales en argent",
    note: "Retraites, allocations chômage, allocations familiales, RSA : de l'argent versé directement aux personnes.",
    items: ["D62PAY"],
  },
  {
    code: "PRESTA_NATURE",
    libelle: "Remboursements de soins",
    note: "Ce que la sécurité sociale rembourse aux ménages : médicaments, consultations, cliniques privées.",
    items: ["D632PAY"],
  },
  {
    code: "SALAIRES",
    libelle: "Rémunération des agents publics",
    note: "Les 5,7 millions d'agents : enseignants, soignants, policiers, militaires, agents des communes.",
    items: ["D1PAY"],
  },
  {
    code: "FONCTIONNEMENT",
    libelle: "Achats et fonctionnement courant",
    note: "Tout ce que la puissance publique achète pour fonctionner : énergie, fournitures, prestataires, entretien.",
    items: ["P2"],
  },
  {
    code: "INVEST",
    libelle: "Investissement",
    note: "Routes, écoles, hôpitaux, matériel militaire, réseaux : ce qui reste après l'année en cours.",
    items: ["OP5ANP"],
  },
  {
    code: "SUBVENTIONS",
    libelle: "Subventions aux entreprises",
    note: "Aides directes à la production, dont les allègements de cotisations compensés.",
    items: ["D3PAY"],
  },
  {
    code: "INTERETS",
    libelle: "Intérêts de la dette",
    note: "Le prix de l'argent déjà emprunté les années précédentes.",
    items: ["D41PAY"],
  },
  {
    code: "TRANSFERTS",
    libelle: "Autres transferts",
    note: "Contribution au budget de l'Union européenne, aide au développement, transferts en capital.",
    items: ["D7PAY", "D9PAY"],
  },
];

/* ------------------------------------------- l'administration d'elle-même */

/**
 * Ce que l'appareil administratif dépense pour son propre fonctionnement.
 *
 * La division 01 de la CFAP (« services généraux des administrations
 * publiques ») mélange deux choses très différentes : l'administration qui
 * s'administre, et des postes qui n'ont rien à voir avec elle — la charge de
 * la dette, la recherche fondamentale, l'aide au développement. On garde les
 * quatre groupes qui décrivent le fonctionnement interne, et on publie les
 * autres à côté plutôt que de les fondre dedans ou de les faire disparaître.
 *
 * Limite connue et non contournable : Eurostat s'arrête au deuxième niveau de
 * la CFAP. Le groupe 01.1 réunit donc la direction politique, l'administration
 * fiscale et la diplomatie sans qu'on puisse les séparer. Il n'existe pas de
 * clé de répartition publiée, et on n'en invente pas.
 */
const ADMIN_INTERNE = ["GF0101", "GF0103", "GF0105", "GF0106"] as const;

/** Les groupes de la division 01 qui ne relèvent pas du fonctionnement interne. */
const ADMIN_HORS = ["GF0107", "GF0104", "GF0102", "GF0108"] as const;

/**
 * Les natures économiques croisées avec la fonction. Les trois premières sont
 * le coût de fonctionnement proprement dit : des gens, des achats, des murs.
 * Les suivantes sont de l'argent qui transite par la ligne budgétaire d'un
 * service administratif sans le faire tourner — au premier rang desquelles la
 * contribution française au budget de l'Union européenne.
 */
const NATURES_ADMIN = [
  { code: "D1", libelle: "Rémunération des agents", fonctionnement: true },
  { code: "P2", libelle: "Achats et fonctionnement courant", fonctionnement: true },
  { code: "OP5ANP", libelle: "Investissement", fonctionnement: true },
  { code: "D7", libelle: "Autres transferts courants", fonctionnement: false },
  { code: "D9", libelle: "Transferts en capital", fonctionnement: false },
  { code: "D29_D5_D8", libelle: "Impôts payés et ajustements", fonctionnement: false },
] as const;

const NA_ITEMS_EXP = ["TE", ...NATURES_ADMIN.map((n) => n.code)];

/* ------------------------------------------------------------------ utils */

const somme = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Somme de montants publiés au dixième de million : on coupe le bruit flottant. */
const sommeNette = (xs: number[]) => Math.round(somme(xs) * 10) / 10;

function indexer(obs: Obs[], dim: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const o of obs) m.set(o[dim], (m.get(o[dim]) ?? 0) + o.value);
  return m;
}

/** Ajoute un poste « Autres » si le détail ne couvre pas le total. */
function avecResidu(total: number, detail: Poste[], libelle = "Autres"): Poste[] {
  const couvert = somme(detail.map((p) => p.montant));
  const residu = Math.round(total - couvert);
  // On ne garde le résidu que s'il est significatif (> 0,05 % du total).
  if (detail.length > 0 && Math.abs(residu) > Math.abs(total) * 0.0005) {
    return [...detail, { code: "AUTRES", libelle, montant: residu }];
  }
  return detail;
}

/* ------------------------------------------------------------------- main */

async function main() {
  const anneeDemandee = process.argv[2];

  console.log("→ Téléchargement des comptes des administrations publiques…");
  const [main, taxag, exp, pib, pop] = await Promise.all([
    fetchDataset("gov_10a_main", { geo: "FR", unit: "MIO_EUR", sector: [...SECTEURS] }),
    fetchDataset("gov_10a_taxag", { geo: "FR", unit: "MIO_EUR", sector: [...SECTEURS] }),
    fetchDataset("gov_10a_exp", {
      geo: "FR",
      unit: "MIO_EUR",
      na_item: NA_ITEMS_EXP,
      sector: [...SECTEURS],
    }),
    fetchDataset("nama_10_gdp", { geo: "FR", unit: "CP_MEUR", na_item: "B1GQ" }),
    fetchDataset("demo_gind", { geo: "FR", indic_de: "AVG" }),
  ]);

  const oMain = flatten(main);
  const oTaxag = flatten(taxag);
  const oExp = flatten(exp);
  const oPib = flatten(pib);
  const oPop = flatten(pop);

  const libCofog = labels(exp, "cofog99");

  const annees = [...new Set(oMain.filter((o) => o.sector === "S13" && o.na_item === "TE").map((o) => o.time))]
    .map(Number)
    .filter((a) => a >= PREMIERE_ANNEE)
    .sort((a, b) => a - b);

  const cible = anneeDemandee ? [Number(anneeDemandee)] : annees;
  console.log(`→ Années disponibles : ${annees[0]}–${annees[annees.length - 1]}`);

  const dossier = join(process.cwd(), "public", "data");
  mkdirSync(dossier, { recursive: true });

  const historique: {
    annee: number;
    recettes: number;
    depenses: number;
    solde: number;
    pib: number;
    complet: boolean;
    /** Coût de fonctionnement propre de l'administration ; nul si le détail
     *  par fonction de l'année n'est pas encore publié. */
    administration: number | null;
  }[] = [];

  for (const annee of cible) {
    const t = String(annee);
    const mainA = oMain.filter((o) => o.time === t);
    const taxA = oTaxag.filter((o) => o.time === t);
    const expA = oExp.filter((o) => o.time === t);
    // `gov_10a_exp` est désormais chargé pour plusieurs natures économiques :
    // tout ce qui raisonne en dépense totale doit filtrer explicitement sur TE.
    const expTE = expA.filter((o) => o.na_item === "TE");

    const val = (sector: string, na: string) =>
      mainA.find((o) => o.sector === sector && o.na_item === na)?.value ?? 0;

    const pibA = oPib.find((o) => o.time === t)?.value ?? 0;
    const popA = oPop.find((o) => o.time === t)?.value ?? 0;

    const depenses = val("S13", "TE");
    const recettes = val("S13", "TR");
    if (!depenses || !recettes) {
      console.log(`  ${annee} : incomplet, ignoré`);
      continue;
    }
    const solde = recettes - depenses;

    // Le détail par fonction (CFAP) et par impôt est publié avec un an de
    // retard sur les agrégats : certaines années n'ont que les grands totaux.
    const complet =
      expTE.some((o) => o.sector === "S13" && o.cofog99.length === 4) &&
      taxA.some((o) => o.sector === "S13");
    // Rempli plus bas, une fois le croisement fonction × nature calculé.
    const ligneHistorique = {
      annee,
      recettes,
      depenses,
      solde,
      pib: pibA,
      complet,
      administration: null as number | null,
    };
    historique.push(ligneHistorique);

    /* ---- recettes : groupes + détail, par secteur collecteur ---- */
    const taxParSecteur = new Map<string, Map<string, number>>();
    for (const s of SECTEURS) {
      taxParSecteur.set(s, indexer(taxA.filter((o) => o.sector === s), "na_item"));
    }
    const taxS13 = taxParSecteur.get("S13")!;

    const recettesPostes: (Poste & { note: string; parSecteur: Record<string, number> })[] = [];
    for (const g of GROUPES_RECETTES) {
      const total = val("S13", g.total);
      if (!total) continue;
      const detail = g.detail
        .map((d) => ({ code: d.code, libelle: d.libelle, montant: taxS13.get(d.code) ?? 0 }))
        .filter((p) => p.montant > 0)
        .sort((a, b) => b.montant - a.montant);
      // Répartition entre secteurs collecteurs, quand la source la donne.
      const parSecteur: Record<string, number> = {};
      for (const s of SECTEURS) {
        if (s === "S13") continue;
        const m = taxParSecteur.get(s)!;
        const v = g.detail.length
          ? somme(g.detail.map((d) => m.get(d.code) ?? 0))
          : 0;
        if (v > 0) parSecteur[s] = v;
      }
      recettesPostes.push({
        code: g.code,
        libelle: g.libelle,
        note: g.note,
        montant: total,
        postes: avecResidu(total, detail, `Autres ${g.libelle.toLowerCase()}`),
        parSecteur,
      });
    }

    const couvert = somme(recettesPostes.map((p) => p.montant));
    if (recettes - couvert > recettes * 0.0005) {
      recettesPostes.push({
        code: "AUTRES_REC",
        libelle: "Autres recettes",
        note: "Transferts reçus, amendes, recettes exceptionnelles.",
        montant: Math.round(recettes - couvert),
        parSecteur: {},
      });
    }
    recettesPostes.sort((a, b) => b.montant - a.montant);

    /* ---- dépenses par fonction (COFOG), deux niveaux ---- */
    const fonctions: (Poste & { parSecteur: Record<string, number> })[] = [];
    const expS13 = expTE.filter((o) => o.sector === "S13");
    const niveau1 = expS13.filter((o) => o.cofog99.length === 4 && o.cofog99 !== "TOTA");
    for (const o of niveau1.sort((a, b) => b.value - a.value)) {
      const prefix = o.cofog99;
      const subs = expS13
        .filter((s) => s.cofog99.length === 6 && s.cofog99.startsWith(prefix) && s.value > 0)
        .map((s) => ({ code: s.cofog99, libelle: libCofog[s.cofog99], montant: s.value }))
        .sort((a, b) => b.montant - a.montant);
      const parSecteur: Record<string, number> = {};
      for (const s of SECTEURS) {
        if (s === "S13") continue;
        const v = expTE.find((e) => e.sector === s && e.cofog99 === prefix)?.value;
        if (v) parSecteur[s] = v;
      }
      fonctions.push({
        code: prefix,
        libelle: libCofog[prefix],
        montant: o.value,
        postes: avecResidu(o.value, subs, "Autres"),
        parSecteur,
      });
    }

    /* ---- dépenses par nature économique ---- */
    const natures: (Poste & { note: string; parSecteur: Record<string, number> })[] = [];
    for (const g of GROUPES_NATURE) {
      const montant = somme(g.items.map((i) => val("S13", i)));
      if (!montant) continue;
      const parSecteur: Record<string, number> = {};
      for (const s of SECTEURS) {
        if (s === "S13") continue;
        const v = somme(g.items.map((i) => val(s, i)));
        if (v) parSecteur[s] = v;
      }
      natures.push({ code: g.code, libelle: g.libelle, note: g.note, montant, parSecteur });
    }
    const couvertNature = somme(natures.map((p) => p.montant));
    if (Math.abs(depenses - couvertNature) > depenses * 0.0005) {
      natures.push({
        code: "AUTRES_DEP",
        libelle: "Autres dépenses",
        note: "Postes résiduels des comptes nationaux.",
        montant: Math.round(depenses - couvertNature),
        parSecteur: {},
      });
    }
    natures.sort((a, b) => b.montant - a.montant);

    /* ---- administrations ---- */
    const administrations = SECTEURS.filter((s) => s !== "S13").map((s) => ({
      code: s,
      ...NOMS_SECTEURS[s],
      depenses: val(s, "TE"),
      recettes: val(s, "TR"),
      agents: val(s, "D1PAY"),
    }));

    /* ---- l'administration d'elle-même ---- */
    // Croisement fonction × nature : c'est lui qui distingue ce qui fait
    // tourner un service de ce qui ne fait que transiter par sa ligne
    // budgétaire. Sans ce croisement, la contribution française au budget de
    // l'Union européenne compterait comme un coût d'administration.
    const montantExp = (sector: string, cofog: string, na: string) =>
      expA.find((o) => o.sector === sector && o.cofog99 === cofog && o.na_item === na)?.value ?? 0;

    const administration = complet
      ? (() => {
          const groupe = (code: string) => {
            const montant = montantExp("S13", code, "TE");
            const parNature = NATURES_ADMIN.map((n) => ({
              ...n,
              montant: montantExp("S13", code, n.code),
            }));
            const parSecteur: Record<string, number> = {};
            for (const s of SECTEURS) {
              if (s === "S13") continue;
              const v = montantExp(s, code, "TE");
              if (v) parSecteur[s] = v;
            }
            return {
              code,
              libelle: libCofog[code],
              montant,
              fonctionnement: sommeNette(
                parNature.filter((n) => n.fonctionnement).map((n) => n.montant),
              ),
              parSecteur,
            };
          };

          const postes = ADMIN_INTERNE.map(groupe)
            .filter((p) => p.montant > 0)
            .sort((a, b) => b.montant - a.montant);
          const montant = sommeNette(postes.map((p) => p.montant));

          const natures: { code: string; libelle: string; fonctionnement: boolean; montant: number }[] =
            NATURES_ADMIN.map((n) => ({
              code: n.code as string,
              libelle: n.libelle as string,
              fonctionnement: n.fonctionnement as boolean,
              montant: sommeNette(ADMIN_INTERNE.map((c) => montantExp("S13", c, n.code))),
            })).filter((n) => n.montant !== 0);
          // Les six natures retenues recouvrent le total à l'euro près sur les
          // années observées. Si un jour ce n'était plus le cas, l'écart se
          // verrait sur la page au lieu de disparaître dans un arrondi.
          const residuNature = Math.round(montant - somme(natures.map((n) => n.montant)));
          if (Math.abs(residuNature) > Math.abs(montant) * 0.0005) {
            natures.push({
              code: "AUTRES",
              libelle: "Autres natures",
              fonctionnement: false,
              montant: residuNature,
            });
          }

          const parSecteur: Record<string, number> = {};
          for (const s of SECTEURS) {
            if (s === "S13") continue;
            const v = sommeNette(ADMIN_INTERNE.map((c) => montantExp(s, c, "TE")));
            if (v) parSecteur[s] = v;
          }

          // La masse salariale publique ventilée par fonction : la seule façon
          // de répondre à « combien de ces rémunérations ne sont ni un
          // enseignant, ni un soignant, ni un policier ».
          const remunerations = expS13
            .filter((o) => o.cofog99.length === 4 && o.cofog99 !== "TOTA")
            .map((o) => ({
              code: o.cofog99,
              libelle: libCofog[o.cofog99],
              montant: montantExp("S13", o.cofog99, "D1"),
            }))
            .filter((p) => p.montant > 0)
            .sort((a, b) => b.montant - a.montant);

          return {
            division: {
              code: "GF01",
              libelle: libCofog.GF01,
              montant: montantExp("S13", "GF01", "TE"),
            },
            interne: {
              montant,
              fonctionnement: sommeNette(
                natures.filter((n) => n.fonctionnement).map((n) => n.montant),
              ),
              postes,
              natures,
              parSecteur,
            },
            horsInterne: ADMIN_HORS.map((code) => ({
              code,
              libelle: libCofog[code],
              montant: montantExp("S13", code, "TE"),
            }))
              .filter((p) => p.montant > 0)
              .sort((a, b) => b.montant - a.montant),
            remunerations: {
              // `gov_10a_main` et `gov_10a_exp` publient la masse salariale à
              // quelques centaines de millions près. On prend le total du même
              // jeu que sa ventilation, pour que les parts bouclent.
              total: montantExp("S13", "TOTAL", "D1"),
              parFonction: remunerations,
            },
          };
        })()
      : null;

    ligneHistorique.administration = administration?.interne.fonctionnement ?? null;

    const doc = {
      meta: {
        annee,
        complet,
        unite: "millions d'euros courants",
        genereLe: new Date().toISOString(),
        misAJourParEurostat: main.updated,
        sources: [
          { id: "gov_10a_main", titre: main.label, url: `https://ec.europa.eu/eurostat/databrowser/view/gov_10a_main` },
          { id: "gov_10a_taxag", titre: taxag.label, url: `https://ec.europa.eu/eurostat/databrowser/view/gov_10a_taxag` },
          { id: "gov_10a_exp", titre: exp.label, url: `https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp` },
          { id: "nama_10_gdp", titre: pib.label, url: `https://ec.europa.eu/eurostat/databrowser/view/nama_10_gdp` },
        ],
      },
      agregats: {
        recettes,
        depenses,
        solde,
        pib: pibA,
        population: popA,
        partPib: pibA ? depenses / pibA : null,
        soldePartPib: pibA ? solde / pibA : null,
      },
      secteurs: NOMS_SECTEURS,
      recettes: recettesPostes,
      fonctions,
      natures,
      administrations,
      administration,
    };

    writeFileSync(join(dossier, `apu-${annee}.json`), JSON.stringify(doc, null, 1));
    const eur = (v: number) => (v / 1000).toFixed(1);
    console.log(
      `  ${annee} : recettes ${eur(recettes)} Md€ · dépenses ${eur(depenses)} Md€` +
        ` · solde ${eur(solde)} Md€${complet ? "" : "  (agrégats seuls)"}`,
    );
  }

  const complets = historique.filter((h) => h.complet).map((h) => h.annee);
  writeFileSync(
    join(dossier, "index.json"),
    JSON.stringify(
      {
        genereLe: new Date().toISOString(),
        misAJourParEurostat: main.updated,
        annees: historique.map((h) => h.annee),
        anneesCompletes: complets,
        // Année par défaut : la plus récente pour laquelle tout le détail existe.
        anneeParDefaut: complets[complets.length - 1],
        historique,
      },
      null,
      1,
    ),
  );
  console.log(`✓ ${historique.length} années écrites dans data/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
