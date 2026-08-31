export default function Chiffre({
  libelle,
  valeur,
  detail,
  ton = "neutre",
}: {
  libelle: string;
  valeur: string;
  detail?: string;
  ton?: "neutre" | "rouge";
}) {
  return (
    <div className="border-l border-trait pl-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.09em] text-ink-doux">
        {libelle}
      </div>
      <div
        className={`mt-1 font-titre text-[1.4rem] leading-tight tabular-nums sm:text-[1.65rem] ${
          ton === "rouge" ? "text-rouge" : "text-ink"
        }`}
      >
        {valeur}
      </div>
      {detail ? (
        <div className="mt-0.5 text-[12.5px] leading-snug text-ink-doux">{detail}</div>
      ) : null}
    </div>
  );
}
