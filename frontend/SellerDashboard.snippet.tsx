// --- Dans SellerDashboard.tsx ---

// 1. Import en haut du fichier :
import { SellerBotPanel } from './SellerBotPanel';

// 2. Dans le JSX, quand shop existe, après le bloc des boutons
//    (Modifier / Voir vitrine / Horaires / Analytics)
//    et AVANT le bloc « Mes produits », insérer :

{shop && (
  <SellerBotPanel
    shopId={shop.id}
    shopName={shop.name}
    defaultWhatsapp={shop.whatsapp_number}
  />
)}
