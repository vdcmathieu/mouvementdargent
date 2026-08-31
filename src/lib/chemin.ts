/**
 * Préfixe une URL absolue du site par le sous-chemin de déploiement.
 * `basePath` de Next ne s'applique ni aux `fetch` ni aux `<a href>` littéraux.
 */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function chemin(p: string): string {
  return `${BASE}${p}`;
}
