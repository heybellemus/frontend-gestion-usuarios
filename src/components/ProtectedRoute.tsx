import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { permissionsService } from '../services/permissionsService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  screenCode?: string | string[];
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  screenCode,
  fallback = null,
  requireAuth = true,
  requireAdmin = false
}) => {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const decodeTokenPayload = (): Record<string, any> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return {};
      const parts = token.split('.');
      if (parts.length !== 3) return {};
      return JSON.parse(atob(parts[1]));
    } catch {
      return {};
    }
  };

  const hasAdminRole = (source: Record<string, any> | null | undefined): boolean => {
    if (!source || typeof source !== 'object') return false;
    const roleName =
      source.rol ||
      source.role ||
      source.nombre_rol ||
      source.rol_nombre ||
      source.role_name ||
      source.group;

    return (
      Number(source.rolid) === 1 ||
      Number(source.rol_id) === 1 ||
      Number(source.role_id) === 1 ||
      source.is_superuser === true ||
      source.is_staff === true ||
      (typeof roleName === 'string' && roleName.toLowerCase().includes('admin'))
    );
  };

  const isAdminFromApi = async (tokenPayload: Record<string, any>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;

      const cacheKey = `is_admin_${token.slice(0, 20)}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached === 'true') return true;
      if (cached === 'false') return false;

      const userId = tokenPayload?.user_id || tokenPayload?.id || tokenPayload?.userid || tokenPayload?.sub;
      const candidates = ['/api/usuarios/me/'];
      if (userId) {
        candidates.push(`/api/usuarios/${userId}/`);
      }

      for (const url of candidates) {
        try {
          const resp = await fetch(`http://localhost:8000${url}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!resp.ok) continue;
          const data = await resp.json();
          if (hasAdminRole(data)) {
            sessionStorage.setItem(cacheKey, 'true');
            return true;
          }
        } catch {
          // Continue with next candidate.
        }
      }

      sessionStorage.setItem(cacheKey, 'false');
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (!requireAuth) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      if (!isAuthenticated) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const tokenPayload = decodeTokenPayload();
      const isAdmin =
        hasAdminRole(user) ||
        hasAdminRole(tokenPayload) ||
        await isAdminFromApi(tokenPayload);

      if (requireAdmin && !isAdmin) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      if (isAdmin) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      if (!permissionsService.isLoaded()) {
        try {
          await permissionsService.loadUserScreens();
        } catch (error) {
          console.error('ProtectedRoute: Error loading permissions:', error);
          setHasAccess(false);
          setLoading(false);
          return;
        }
      }

      let access = true;

      if (screenCode) {
        access = Array.isArray(screenCode)
          ? permissionsService.hasAccessAny(screenCode)
          : permissionsService.hasAccess(screenCode);
      } else {
        const publicPaths = ['/', '/login', '/QRLogin'];
        const isPublicPath = publicPaths.includes(location.pathname);
        access = isPublicPath ? true : permissionsService.hasPathAccess(location.pathname);
      }

      setHasAccess(access);
      setLoading(false);
    };

    checkAccess();
  }, [screenCode, isAuthenticated, requireAuth, requireAdmin, location.pathname, user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (hasAccess === true) {
    return <>{children}</>;
  }

  return fallback || (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta pantalla.</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;
