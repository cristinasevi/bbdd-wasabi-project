"use client"

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export function ClosePreventionProvider({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isLoginPage = pathname === '/';

  useEffect(() => {
    // Solo prevenir el cierre si hay una sesión activa y no estamos en la página de login
    if (session && !isLoginPage) {
      const handleBeforeUnload = (e) => {
        // Verificar si se hizo un logout explícito
        const wasExplicitLogout = localStorage.getItem('wasabi_explicit_logout') === 'true';
        
        // Si fue logout explícito, no mostrar advertencia
        if (wasExplicitLogout) {
          return;
        }
        
        // Solo mostrar advertencia si NO fue logout explícito
        const message = '¿Desea salir del sitio? Es posible que los cambios realizados no se guarden.';
        e.preventDefault();
        e.returnValue = message;
        return message;
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [session, isLoginPage]);

  return <>{children}</>;
}