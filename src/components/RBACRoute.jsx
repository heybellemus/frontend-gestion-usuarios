import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { rbacApi } from '../services/rbacApi';

const RBACRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requiredCodes = [],
  authOnly = false,
  fallback = null,
}) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        if (!requireAuth) {
          setAllowed(true);
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
          setAllowed(false);
          setLoading(false);
          return;
        }

        if (requireAdmin) {
          const isAdmin = await rbacApi.isAdmin(true);
          setAllowed(isAdmin);
          setLoading(false);
          return;
        }

        if (authOnly) {
          setAllowed(true);
          setLoading(false);
          return;
        }

        if (Array.isArray(requiredCodes) && requiredCodes.length > 0) {
          const result = await rbacApi.verifyAccess(requiredCodes);
          setAllowed(result.allGranted);
          setLoading(false);
          return;
        }

        const hasPathAccess = await rbacApi.hasPathAccess(location.pathname);
        setAllowed(hasPathAccess);
      } catch (error) {
        console.error('RBACRoute error:', error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [location.pathname, requireAuth, requireAdmin, authOnly, JSON.stringify(requiredCodes)]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !localStorage.getItem('authToken')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowed) {
    return children;
  }

  return fallback || (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
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

export default RBACRoute;
