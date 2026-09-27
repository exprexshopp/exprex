/**
 * Normalise une URL d'image (absolue, relative, base64, vide)
 * ET optimise automatiquement les URLs Cloudinary pour mobile.
 * 
 * - Images statiques (/storage/xxx.webp) → tel quel (servies par Vercel frontend)
 * - Images Cloudinary → ajout de f_auto,q_auto,w_800,c_limit
 * - Images base64 (data:image/...) → tel quel
 */
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null;
  
  const trimmed = path.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  
  // ✅ Cloudinary → ajouter paramètres d'optimisation
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/upload/')) {
    // Éviter de double-ajouter les paramètres si déjà présents
    if (trimmed.includes('/upload/f_auto') || trimmed.includes('/upload/q_auto')) {
      return trimmed;
    }
    
    // Insérer les transformations AVANT le /upload/ existant
    return trimmed.replace(
      '/upload/',
      '/upload/f_auto,q_auto,w_800,c_limit/'
    );
  }
  
  // Absolue ou base64 → tel quel
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  
  // ✅ Relative (/storage/xxx.webp) → tel quel
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}