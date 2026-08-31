import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Annee, Index } from "./types";

const dossier = join(process.cwd(), "public", "data");

export async function lireIndex(): Promise<Index> {
  return JSON.parse(await readFile(join(dossier, "index.json"), "utf8")) as Index;
}

export async function lireAnnee(annee: number): Promise<Annee> {
  return JSON.parse(await readFile(join(dossier, `apu-${annee}.json`), "utf8")) as Annee;
}
