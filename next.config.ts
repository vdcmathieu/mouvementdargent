import type { NextConfig } from "next";

/**
 * Le site est servi sous un sous-chemin de vandecatsije.com. `basePath`
 * réécrit les routes et les ressources Next, mais pas les `fetch` ni les
 * `<a href>` écrits à la main : ceux-là passent par `chemin()`.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
};

export default nextConfig;
