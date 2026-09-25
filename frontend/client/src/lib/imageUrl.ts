/**
 * Normalise une URL d'image (absolue, relative, base64, vide).
 * 
 * - Les images statiques du bundle (/storage/xxx.webp) restent relatives
 *   car elles sont servies par le frontend Vercel lui-même.
 * - Les images Cloudinary (https://res.cloudinary.com/...) passent telles quelles.
 * - Les images base64 (data:image/...) passent telles quelles.
 */
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  
  const trimmed = path.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  
  // Absolue ou base64 → tel quel
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  
  // ✅ Relative (/storage/xxx.webp) → tel quel
  // Ces images sont servies par le frontend Vercel (public/storage/)
  // OU proxifiées vers le backend selon la config Vite
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}