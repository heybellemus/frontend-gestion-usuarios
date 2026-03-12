import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { permissionsService } from '../services/permissionsService';

const DebugPermissions: React.FC = () => {
  const { screens, loading, error } = usePermissions();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const isServiceLoaded = permissionsService.isLoaded ? permissionsService.isLoaded() : false;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <div className="font-bold mb-2">Debug Permissions</div>
      
      <div className="mb-2">
        <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
      </div>
      
      <div className="mb-2">
        <strong>Error:</strong> {error || 'None'}
      </div>
      
      <div className="mb-2">
        <strong>Screens count:</strong> {screens.length}
      </div>
      
      <div className="mb-2">
        <strong>Service loaded:</strong> {isServiceLoaded ? 'Yes' : 'No'}
      </div>
      
      <details className="mb-2">
        <summary className="cursor-pointer">All Screens ({screens.length})</summary>
        <div className="mt-2 max-h-40 overflow-y-auto">
          {screens.map((screen, index) => (
            <div key={index} className="mb-1 border-b border-gray-600 pb-1">
              <div><strong>{screen.codigo}</strong> - {screen.nombre}</div>
              <div className="text-gray-300">
                Ruta: {screen.ruta || 'None'} | 
                Activo: {screen.activo !== false ? 'Yes' : 'No'} |
                Módulo: {screen.modulo || 'None'}
              </div>
            </div>
          ))}
        </div>
      </details>
      
      <div className="mb-2">
        <strong>Navigation Screens:</strong> {screens.filter(s => (s.ruta || s.codigo) && s.activo !== false).length}
      </div>
      
      <button
        onClick={() => {
          console.log('All screens:', screens);
          console.log('Service screens:', permissionsService.getAllScreens ? permissionsService.getAllScreens() : 'Method not available');
          console.log('Navigation screens:', permissionsService.getNavigationScreens ? permissionsService.getNavigationScreens() : 'Method not available');
        }}
        className="bg-blue-600 px-2 py-1 rounded text-xs"
      >
        Log to Console
      </button>
    </div>
  );
};

export default DebugPermissions;
