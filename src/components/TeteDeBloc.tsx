/**
 * L'en-tête d'un bloc à l'intérieur d'une section : le titre tient la colonne
 * de gauche, l'explication celle de droite, et un filet ferme l'ensemble. Le
 * bandeau occupe toute la largeur, ce qui évite qu'une longue section paraisse
 * tassée sur le bord gauche de la page.
 */
export default function TeteDeBloc({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-x-12 gap-y-2 border-b border-encre pb-2.5 lg:grid-cols-12">
      <h3 className="text-[13px] font-semibold uppercase leading-snug tracking-[0.09em] lg:col-span-4">
        {titre}
      </h3>
      <p className="text-[13.5px] leading-relaxed text-encre-2 lg:col-span-8">{children}</p>
    </div>
  );
}
