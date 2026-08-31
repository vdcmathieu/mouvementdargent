/**
 * Client minimal pour l'API de diffusion Eurostat (JSON-stat 2.0).
 * Les comptes nationaux des administrations publiques françaises sont produits
 * par l'Insee puis transmis à Eurostat au titre du SEC 2010 : les chiffres sont
 * donc identiques à ceux publiés par l'Insee, avec une API stable en prime.
 */
const BASE =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

export type JsonStat = {
  label: string;
  updated: string;
  id: string[];
  size: number[];
  dimension: Record<
    string,
    { label: string; category: { index: Record<string, number>; label: Record<string, string> } }
  >;
  value: Record<string, number>;
};

/** Une observation aplatie : les codes de chaque dimension + la valeur. */
export type Obs = Record<string, string> & { value: number };

export async function fetchDataset(
  dataset: string,
  params: Record<string, string | string[]>,
): Promise<JsonStat> {
  const qs = new URLSearchParams({ format: "JSON", lang: "fr" });
  for (const [k, v] of Object.entries(params)) {
    for (const item of Array.isArray(v) ? v : [v]) qs.append(k, item);
  }
  const url = `${BASE}/${dataset}?${qs}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return (await res.json()) as JsonStat;
    } catch (err) {
      if (attempt === 3) throw new Error(`Échec ${dataset} : ${String(err)}\n${url}`);
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

/** Déplie un JSON-stat en observations, index linéaire -> coordonnées. */
export function flatten(js: JsonStat): Obs[] {
  const { id, size } = js;
  const strides = new Array<number>(size.length).fill(1);
  for (let i = size.length - 2; i >= 0; i--) strides[i] = strides[i + 1] * size[i + 1];
  const reverse = id.map((dim) => {
    const out: string[] = [];
    for (const [code, i] of Object.entries(js.dimension[dim].category.index)) out[i] = code;
    return out;
  });
  return Object.entries(js.value)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([pos, value]) => {
      const p = Number(pos);
      const obs = { value } as Obs;
      id.forEach((dim, i) => {
        obs[dim] = reverse[i][Math.floor(p / strides[i]) % size[i]];
      });
      return obs;
    });
}

/** Libellé officiel (en français) d'un code de dimension. */
export function labels(js: JsonStat, dim: string): Record<string, string> {
  return js.dimension[dim].category.label;
}
