import { useState, useEffect } from 'react';
import { permissionsService } from '../services/permissionsService';

export const usePermissions = () => {
  const [loading, setLoading] = useState(true);
  const [screens, setScreens] = useState([]);

  const loadPermissions = async () => {
    try {
      const userScreens = await permissionsService.loadUserScreens();
      setScreens(userScreens);
    } catch (error) {
      console.error('Error cargando permisos:', error);
      setScreens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsService.permissionsLoaded) {
      loadPermissions();
    } else {
      setScreens(permissionsService.userScreens || []);
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

  const hasAccess = (screenCode) => permissionsService.hasAccess(screenCode);
  const getScreensByModule = (module) => permissionsService.getScreensByModule(module);
  const getNavigationScreens = () => permissionsService.getNavigationScreens();

  const refreshPermissions = async () => {
    setLoading(true);
    await loadPermissions();
  };

  return {
    loading,
    screens,
    hasAccess,
    getScreensByModule,
    getNavigationScreens,
    refreshPermissions
  };
};
