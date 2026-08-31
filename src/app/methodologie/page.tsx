import Link from "next/link";
import { lireAnnee, lireIndex } from "@/lib/donnees";
import { euros, milliards, pourcent } from "@/lib/format";

export const metadata = { title: "Méthode" };
export const dynamic = "force-static";

export default async function Page() {
  const index = await lireIndex();
  const d = await lireAnnee(index.anneeParDefaut);
  const cumul = d.administrations.reduce((a, x) => a + x.depenses, 0);

  return (
    <main className="mx-auto max-w-[730px] px-6 py-14">
      <Link href="/" className="lien text-[13.5px] text-encre-2 hover:text-encre">
        ← Le diagramme
      </Link>

      <h1 className="mt-8 font-titre text-[2.4rem] leading-tight tracking-[-0.015em]">
        Méthode et limites
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-encre-2">
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
          <strong>
            {milliards(d.administrations.find((a) => a.code === "S1311")?.depenses ?? 0)}
          </strong>{" "}
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
              <a href={s.url} className="lien font-medium">
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
          À droite, deux lectures. « À quoi ça sert » répartit la dépense par <em>fonction</em>{" "}
          (classification CFAP/COFOG : santé, enseignement, protection sociale…), sur deux niveaux
          de détail. « Sous quelle forme » la répartit par <em>nature économique</em> : salaires,
          achats, prestations versées, investissement, intérêts.
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
          {milliards(d.agregats.depenses - d.fonctions.reduce((a, f) => a + f.montant, 0))} au total
          publié dans la table des agrégats, soit moins de 0,1 %. Aucun ajustement n&apos;est
          appliqué : l&apos;écart reste visible dans les fichiers publiés.
        </p>
      </Section>

      <Section titre="Les quatre unités d'affichage">
        <p>
          Un milliard d&apos;euros ne veut rien dire pour personne. Le sélecteur d&apos;unité, en
          haut de page, ne change jamais les données : il applique au montant publié l&apos;une de
          ces quatre opérations, et rien d&apos;autre.
        </p>
        <ul className="mt-4 space-y-2">
          <li>
            <strong>Milliards d&apos;euros.</strong> Le montant publié, tel quel, en euros courants
            de l&apos;année.
          </li>
          <li>
            <strong>Par habitant.</strong> Le montant divisé par la population publiée pour la même
            année ({d.agregats.population.toLocaleString("fr-FR")} habitants en {d.meta.annee}).
          </li>
          <li>
            <strong>Pour 1 000 € dépensés.</strong> La part du poste dans le total, appliquée à
            une dépense de 1 000 € : un poste qui pèse {pourcent(0.1, 0)} du total s&apos;affiche{" "}
            {euros(100)}. C&apos;est une règle de trois sur la structure réelle de l&apos;année.
            Ce n&apos;est pas votre imposition personnelle, que ces données ne permettent pas de
            calculer.
          </li>
          <li>
            <strong>En part du total.</strong> Le montant rapporté au total des dépenses de
            l&apos;année.
          </li>
        </ul>
        <p className="mt-4">
          Les trois dernières sont des transformations exactes et réversibles de la première. Aucun
          arrondi n&apos;est appliqué avant l&apos;affichage.
        </p>
      </Section>

      <Section titre="La ventilation par administration n'est pas consolidée">
        <p>
          La section « Qui dépense » montre les dépenses de l&apos;État et de ses opérateurs, des
          collectivités locales et de la sécurité sociale, prises séparément. Ces trois montants
          s&apos;additionnent à <strong>{milliards(cumul)}</strong>, soit davantage que les{" "}
          <strong>{milliards(d.agregats.depenses)}</strong> de dépense publique consolidée.
        </p>
        <p>
          Ce n&apos;est pas une erreur. L&apos;État verse chaque année des sommes considérables aux
          deux autres ; ces transferts sont une dépense pour l&apos;État et une recette puis une
          dépense pour le destinataire. Le total consolidé les retire une fois. On publie les deux
          chiffres et on explique l&apos;écart plutôt que de le lisser.
        </p>
        <p>
          Pour la même raison, les barres « qui porte quelle mission » se lisent comme des parts de
          la dépense <em>non consolidée</em> de chaque fonction, pas comme des parts du total
          national.
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
            <strong>Les transferts entre administrations sont invisibles</strong> dans les totaux
            consolidés. C&apos;est correct pour mesurer la dépense réelle, mais cela masque la
            circulation interne.
          </li>
          <li>
            <strong>Les niches fiscales ne sont pas des dépenses ici.</strong> Un crédit
            d&apos;impôt réduit les recettes ; il n&apos;apparaît pas comme une ligne de dépense,
            conformément à la comptabilité nationale.
          </li>
          <li>
            <strong>Le détail arrive avec un an de retard.</strong> Les grands agrégats d&apos;une
            année sont publiés au printemps suivant, la ventilation par fonction un an après. Les
            années sans détail portent une astérisque dans le sélecteur.
          </li>
          <li>
            <strong>Aucune granularité par ministère, programme ou commune.</strong> C&apos;est la
            limite du périmètre national. Ce niveau existe dans d&apos;autres sources ouvertes, et
            constitue la suite logique de ce travail.
          </li>
        </ul>
      </Section>

      <Section titre="Les couleurs sont une information, pas une décoration">
        <p>
          Le bleu porte tout ce qui entre, le rouge ce qui manque, l&apos;encre le total ; les
          emplois portent une famille chaude, jamais bleue. Dans les ressources, plus un poste est
          gros, plus il est foncé.
        </p>
        <p>
          Les teintes ne sont pas choisies à l&apos;œil. Elles sortent d&apos;une recherche sous
          contrainte : bande de luminosité, chroma minimal, contraste d&apos;au moins 3:1 sur le
          fond, et surtout séparation suffisante entre teintes voisines une fois simulées en
          protanopie et en deutéranopie. Chaque poste porte de toute façon son libellé et son
          montant écrits : la couleur n&apos;est jamais le seul canal d&apos;information.
        </p>
      </Section>

      <Section titre="Licence">
        <p>
          Le code est publié sous licence MIT. Les données d&apos;origine sont sous licence ouverte
          Eurostat/Insee et restent librement réutilisables, avec mention de la source.
        </p>
      </Section>

      <p className="mt-14 border-t border-trait pt-6 text-[13.5px] text-encre-2">
        Une erreur, une formulation trompeuse, une lecture qui manque ?{" "}
        <a href="https://github.com/vdcmathieu/mouvementdargent/issues" className="lien hover:text-encre">
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
      <h2 className="font-titre text-[1.5rem] leading-snug">{titre}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-encre-2 [&_code]:rounded [&_code]:bg-fond-3 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px] [&_strong]:text-encre">
        {children}
      </div>
    </section>
  );
}
