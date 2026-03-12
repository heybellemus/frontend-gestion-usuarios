import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { permissionsService } from '../services/permissionsService';

const PermissionsContext = createContext();

const permissionsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PERMISSIONS':
      return { ...state, screens: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'REFRESH_PERMISSIONS':
      return { ...state, loading: true };
    case 'CLEAR_PERMISSIONS':
      return { screens: [], loading: true };
    default:
      return state;
  }
};

export const PermissionsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(permissionsReducer, {
    screens: [],
    loading: true
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
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialPermissions();
  }, []);

  const hasAccess = (screenCode) => {
    return state.screens.some(screen => screen.codigo === screenCode);
  };

  const refreshPermissions = async () => {
    dispatch({ type: 'REFRESH_PERMISSIONS' });
    try {
      const screens = await permissionsService.refreshPermissions();
      dispatch({ type: 'SET_PERMISSIONS', payload: screens });
    } catch (error) {
      console.error('Error refrescando permisos:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearPermissions = () => {
    permissionsService.clearPermissions();
    dispatch({ type: 'CLEAR_PERMISSIONS' });
  };

  return (
    <PermissionsContext.Provider value={{
      ...state,
      hasAccess,
      refreshPermissions,
      clearPermissions,
      dispatch
    }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionsContext must be used within PermissionsProvider');
  }
  return context;
};
