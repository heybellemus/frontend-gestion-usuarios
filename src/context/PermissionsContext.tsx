import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { permissionsService, Screen } from '../services/permissionsService';

interface PermissionsState {
  screens: Screen[];
  loading: boolean;
  error: string | null;
}

type PermissionsAction =
  | { type: 'SET_PERMISSIONS'; payload: Screen[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'REFRESH_PERMISSIONS' }
  | { type: 'CLEAR_PERMISSIONS' };

interface PermissionsContextValue extends PermissionsState {
  hasAccess: (screenCode: string) => boolean;
  getScreensByModule: (module: string) => Screen[];
  getNavigationScreens: () => Screen[];
  refreshPermissions: () => Promise<void>;
  clearPermissions: () => void;
  checkScreenAccess: (screenCode: string) => Promise<boolean>;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

const permissionsReducer = (state: PermissionsState, action: PermissionsAction): PermissionsState => {
  switch (action.type) {
    case 'SET_PERMISSIONS':
      return { ...state, screens: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'REFRESH_PERMISSIONS':
      return { ...state, loading: true, error: null };
    case 'CLEAR_PERMISSIONS':
      return { screens: [], loading: true, error: null };
    default:
      return state;
  }
};

interface PermissionsProviderProps {
  children: React.ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(permissionsReducer, {
    screens: [],
    loading: true,
    error: null
  });

  // Cargar permisos al montar el provider
  useEffect(() => {
    const loadInitialPermissions = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const screens = await permissionsService.loadUserScreens();
          dispatch({ type: 'SET_PERMISSIONS', payload: screens });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Error inicializando permisos:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Error desconocido' 
        });
      }
    };

    loadInitialPermissions();
  }, []);

  const hasAccess = (screenCode: string): boolean => {
    return state.screens.some(screen => screen.codigo === screenCode);
  };

  const getScreensByModule = (module: string): Screen[] => {
    return state.screens.filter(screen => screen.modulo === module);
  };

  const getNavigationScreens = (): Screen[] => {
    return state.screens.filter(screen => screen.ruta && screen.activo);
  };

  const refreshPermissions = async (): Promise<void> => {
    dispatch({ type: 'REFRESH_PERMISSIONS' });
    try {
      const screens = await permissionsService.loadUserScreens();
      dispatch({ type: 'SET_PERMISSIONS', payload: screens });
    } catch (error) {
      console.error('Error refrescando permisos:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  };

  const clearPermissions = (): void => {
    permissionsService.clearPermissions();
    dispatch({ type: 'CLEAR_PERMISSIONS' });
  };

  const checkScreenAccess = async (screenCode: string): Promise<boolean> => {
    try {
      return await permissionsService.checkScreenAccess(screenCode);
    } catch (error) {
      console.error('Error verificando acceso:', error);
      return false;
    }
  };

  const value: PermissionsContextValue = {
    ...state,
    hasAccess,
    getScreensByModule,
    getNavigationScreens,
    refreshPermissions,
    clearPermissions,
    checkScreenAccess
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = (): PermissionsContextValue => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionsContext must be used within PermissionsProvider');
  }
  return context;
};

// Hook para verificar permisos individualmente
export const usePermission = (screenCode: string): { hasAccess: boolean; loading: boolean } => {
  const { hasAccess, loading } = usePermissionsContext();
  return {
    hasAccess: hasAccess(screenCode),
    loading
  };
};

// Hook para múltiples permisos
export const useMultiplePermissions = (screenCodes: string[]): Record<string, boolean> => {
  const { hasAccess } = usePermissionsContext();
  
  return screenCodes.reduce((acc, code) => {
    acc[code] = hasAccess(code);
    return acc;
  }, {} as Record<string, boolean>);
};
