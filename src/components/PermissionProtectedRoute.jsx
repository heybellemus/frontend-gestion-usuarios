import React, { useEffect, useState } from 'react';
import { permissionsService } from '../services/permissionsService';
 
const PermissionProtectedRoute = ({ children, screenCode, fallback = null }) => {
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const checkAccess = async () => {
      if (!permissionsService.permissionsLoaded) {
        await permissionsService.loadUserScreens();
      }
      
      const access = permissionsService.hasAccess(screenCode);
      setHasAccess(access);
      setLoading(false);
    };
 
    if (screenCode) {
      checkAccess();
    } else {
      setHasAccess(true);
      setLoading(false);
    }
  }, [screenCode]);
 
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
 
  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">No tienes permisos para acceder a esta pantalla.</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }
 
  return children;
};
 
export default PermissionProtectedRoute;
