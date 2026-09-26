// frontend/client/src/components/AdminGuard.tsx

import { ReactNode, useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Navigate } from 'wouter';
import api from '../services/db';  // ✅ Ou import { default as api } from '../services/db'

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { currentUser, isLoading } = useApp();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (currentUser) {
        // Vérifier le rôle via le serveur
        try {
          const response = await api.get('/users/me');
          const user = response.data;
          setIsAdmin(user.role === 'ADMIN' || user.is_staff);
        } catch (error) {
          setIsAdmin(false);
        }
      }
    };
    
    if (currentUser) {
      checkAdmin();
    }
  }, [currentUser]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}