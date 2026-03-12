import { useState, useEffect } from 'react';
import { permissionsService, Screen } from '../services/permissionsService';

export const usePermissions = () => {
  const [loading, setLoading] = useState(true);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = async () => {
    try {
      setError(null);
      const userScreens = await permissionsService.loadUserScreens();
      setScreens(userScreens);
    } catch (error) {
      console.error('Error cargando permisos:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setScreens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsService.isLoaded()) {
      loadPermissions();
    } else {
      setScreens(permissionsService.getAllScreens());
      setLoading(false);
    }

    const handlePermissionsUpdated = async () => {
      setLoading(true);
      await loadPermissions();
    };

    window.addEventListener('permissions-updated', handlePermissionsUpdated);
    return () => {
      window.removeEventListener('permissions-updated', handlePermissionsUpdated);
    };
  }, []);

  const hasAccess = (screenCode: string): boolean => {
    return permissionsService.hasAccess(screenCode);
  };

  const getScreensByModule = (module: string): Screen[] => {
    return permissionsService.getScreensByModule(module);
  };

  const getNavigationScreens = (): Screen[] => {
    return permissionsService.getNavigationScreens();
  };

  const refreshPermissions = async (): Promise<void> => {
    setLoading(true);
    await loadPermissions();
  };

  const checkScreenAccess = async (screenCode: string): Promise<boolean> => {
    try {
      return await permissionsService.checkScreenAccess(screenCode);
    } catch (error) {
      console.error('Error verificando acceso:', error);
      return false;
    }
  };

  return {
    loading,
    screens,
    error,
    hasAccess,
    getScreensByModule,
    getNavigationScreens,
    refreshPermissions,
    checkScreenAccess,
    isLoaded: permissionsService.isLoaded()
  };
};
