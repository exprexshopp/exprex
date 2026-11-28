// --- Ajout minimal dans App.tsx (ou AppContent) ---
// Ne touche pas au reste de la navigation / dashboards.

import { ExprexChatWidget } from './components/ExprexChatWidget';

// Dans le return du layout (à côté de BottomNav, après les modals) :
// currentUser vient déjà de useApp()

<ExprexChatWidget userId={currentUser?.id ?? null} />
