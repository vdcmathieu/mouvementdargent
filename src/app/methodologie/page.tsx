import Link from "next/link";
import { lireAnnee, lireIndex } from "@/lib/donnees";
import { milliards } from "@/lib/format";

export const metadata = { title: "Méthode" };
export const dynamic = "force-static";

export default async function Page() {
  const index = await lireIndex();
  const d = await lireAnnee(index.anneeParDefaut);

  return (
    <main className="mx-auto max-w-[720px] px-6 py-14">
      <Link
        href="/"
        className="text-[13.5px] text-ink-doux underline decoration-trait underline-offset-4 hover:text-ink"
      >
        ← Le diagramme
      </Link>

      <h1 className="mt-8 font-titre text-[2.3rem] leading-tight tracking-[-0.015em]">
        Méthode et limites
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-ink-doux">
        Ce site n&apos;a d&apos;intérêt que si l&apos;on peut vérifier chacun de ses chiffres. Voici
        exactement ce qu&apos;il montre, d&apos;où viennent les données, et ce qu&apos;elles ne
        disent pas.
      </p>

      <Section titre="Le périmètre : toutes les administrations publiques">
        <p>
          Le diagramme couvre les <em>administrations publiques</em> au sens de la comptabilité
          nationale : l&apos;État et ses opérateurs, les collectivités locales, et la sécurité
          sociale. C&apos;est le périmètre pertinent pour répondre à « où va l&apos;argent public ».
        </p>
        <p>
          Il ne faut pas le confondre avec le budget de l&apos;État voté au Parlement, qui est
          environ trois fois plus petit : il ne contient ni les retraites, ni l&apos;assurance
          maladie, ni les dépenses des communes, des départements et des régions. Pour{" "}
          {d.meta.annee}, le périmètre retenu ici représente{" "}
          <strong>{milliards(d.agregats.depenses)}</strong> de dépenses, contre{" "}
          <strong>{milliards(d.administrations.find((a) => a.code === "S1311")?.depenses ?? 0)}</strong>{" "}
          pour l&apos;État et ses opérateurs seuls.
        </p>
      </Section>

      <Section titre="La source">
        <p>
          Toutes les valeurs proviennent des comptes nationaux annuels des administrations
          publiques, produits par l&apos;<strong>Insee</strong> selon le règlement européen SEC 2010,
          puis transmis à Eurostat. Les chiffres sont donc identiques à ceux que publie l&apos;Insee ;
          on passe par l&apos;API d&apos;Eurostat parce qu&apos;elle est stable, complète et
          interrogeable automatiquement.
        </p>
        <ul className="mt-4 space-y-2">
          {d.meta.sources.map((s) => (
            <li key={s.id}>
              <a href={s.url} className="font-medium underline decoration-trait underline-offset-4">
                {s.id}
              </a>{" "}
              — {s.titre}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Le script de collecte est dans le dépôt : <code>scripts/build-data.ts</code>. Il
          reconstruit l&apos;intégralité des fichiers publiés ici en une commande.
        </p>
      </Section>

      <Section titre="Comment le diagramme est construit">
        <p>
          Le tronc central porte le total des <em>dépenses</em> de l&apos;année. À gauche, les
          ressources qui les financent : les recettes, plus l&apos;emprunt, puisqu&apos;en France les
          dépenses dépassent les recettes. Les deux côtés s&apos;équilibrent donc exactement.
        </p>
        <p>
          À droite, deux lectures. « À quoi sert l&apos;argent » répartit la dépense par
          <em> fonction</em> (classification CFAP/COFOG : santé, enseignement, protection sociale…),
          sur deux niveaux de détail. « Comment il est dépensé » la répartit par{" "}
          <em>nature économique</em> : salaires, achats, prestations versées, investissement,
          intérêts.
        </p>
        <p>
          Quand la somme des sous-postes ne recouvre pas exactement le total publié, l&apos;écart
          apparaît tel quel dans une ligne « Autres ». Il n&apos;est jamais réparti au prorata sur
          les autres postes.
        </p>
        <p>
          Deux tables d&apos;Eurostat peuvent diverger très légèrement parce qu&apos;elles ne sont
          pas rafraîchies le même jour. Pour {d.meta.annee}, le total des dépenses ventilées par
          fonction est inférieur d&apos;environ{" "}
          {milliards(
            d.agregats.depenses - d.fonctions.reduce((a, f) => a + f.montant, 0),
          )}{" "}
          au total publié dans la table des agrégats, soit moins de 0,1 %. Aucun ajustement
          n&apos;est appliqué : l&apos;écart reste visible dans les fichiers publiés.
        </p>
      </Section>

      <Section titre="Ce que les données ne permettent pas de montrer">
        <ul className="space-y-3">
          <li>
            <strong>La CSG n&apos;est pas isolée.</strong> Dans la nomenclature européenne, elle est
            classée avec l&apos;impôt sur le revenu. Le poste « Impôt sur le revenu, CSG et CRDS »
            agrège donc les deux, et la CSG en représente à peu près la moitié.
          </li>
          <li>
            <strong>Les transferts entre administrations sont invisibles.</strong> L&apos;État
            reverse chaque année des sommes considérables aux collectivités et à la sécurité sociale.
            Les totaux présentés sont consolidés, c&apos;est-à-dire nettoyés de ces doubles comptes —
            ce qui est correct pour mesurer la dépense réelle, mais masque la circulation interne.
          </li>
          <li>
            <strong>Les niches fiscales ne sont pas des dépenses ici.</strong> Un crédit
            d&apos;impôt réduit les recettes ; il n&apos;apparaît pas comme une ligne de dépense,
            conformément à la comptabilité nationale.
          </li>
          <li>
            <strong>Le détail arrive avec un an de retard.</strong> Les grands agrégats d&apos;une
            année sont publiés au printemps suivant, la ventilation par fonction un an après. Les
            années sans détail sont grisées dans le sélecteur.
          </li>
          <li>
            <strong>Aucune granularité par ministère, programme ou commune.</strong> C&apos;est la
            limite du périmètre national. Ce niveau existe dans d&apos;autres sources ouvertes, et
            constitue la suite logique de ce travail.
          </li>
        </ul>
      </Section>

      <Section titre="Licence">
        <p>
          Le code est publié sous licence MIT. Les données d&apos;origine sont sous licence ouverte
          Eurostat/Insee et restent librement réutilisables, avec mention de la source.
        </p>
      </Section>

      <p className="mt-14 border-t border-trait pt-6 text-[13.5px] text-ink-doux">
        Une erreur, une formulation trompeuse, une lecture qui manque ?{" "}
        <a
          href="https://github.com/vdcmathieu/mouvementdargent/issues"
          className="underline decoration-trait underline-offset-4 hover:text-ink"
        >
          Ouvrez une issue
        </a>
        .
      </p>
    </main>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-11">
      <h2 className="font-titre text-[1.45rem] leading-snug">{titre}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-doux [&_code]:rounded [&_code]:bg-paper-3 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}
