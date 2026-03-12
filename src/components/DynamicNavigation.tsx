import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import {
  Home,
  Users,
  Building2,
  UserCircle,
  Shield,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Database,
  Key,
  ClipboardList,
  UserCheck,
  QrCode
} from 'lucide-react';
import { Screen } from '../services/permissionsService';

// Mapeo de iconos para pantallas
const iconMap: Record<string, React.ComponentType<any>> = {
  'dashboard': Home,
  'clientes': Users,
  'usuarios': UserCircle,
  'departamentos': Building2,
  'roles': Shield,
  'auditoria': FileText,
  'permisos': Key,
  'rolpermisos': Shield,
  'notificaciones': Bell,
  'configuracion': Settings,
  'database': Database,
  'reports': FileText,
  'logs': ClipboardList,
  'user_management': UserCheck,
  'qr_scanner': QrCode,
  'qr_login': QrCode
};

interface NavigationItemProps {
  screen: Screen;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ screen }) => {
  const IconComponent = iconMap[screen.codigo] || Home;
  
  // Generar ruta dinámicamente si no existe
  const route = screen.ruta || `/${screen.codigo}`;
  
  return (
    <NavLink
      to={route}
      className={({ isActive }) => 
        `nav-link flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive 
            ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }`
      }
      title={screen.descripcion || screen.nombre}
    >
      <IconComponent className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium truncate">{screen.nombre}</span>
    </NavLink>
  );
};

interface NavigationModuleProps {
  moduleName: string;
  screens: Screen[];
  defaultExpanded?: boolean;
}

const NavigationModule: React.FC<NavigationModuleProps> = ({ 
  moduleName, 
  screens, 
  defaultExpanded = false 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  if (screens.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
      >
        <span>{moduleName}</span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>
      {isExpanded && (
        <div className="mt-1 space-y-1">
          {screens.map((screen) => (
            <NavigationItem key={screen.codigo} screen={screen} />
          ))}
        </div>
      )}
    </div>
  );
};

const DynamicNavigation: React.FC = () => {
  const { screens, loading, error } = usePermissions();

  // Debug: Ver todas las pantallas cargadas
  console.log('DynamicNavigation: All screens loaded:', screens);
  console.log('DynamicNavigation: Loading:', loading, 'Error:', error);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-sidebar-foreground/70">Cargando navegación...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <span className="text-sm text-red-600">Error cargando permisos</span>
        </div>
      </div>
    );
  }

  // Si no hay pantallas, mostrar mensaje
  if (!screens || screens.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <Home className="w-12 h-12 text-sidebar-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-sidebar-foreground/60">
          No hay pantallas disponibles
        </p>
        <p className="text-xs text-sidebar-foreground/40 mt-1">
          Contacta al administrador para obtener permisos
        </p>
      </div>
    );
  }

  // Obtener pantallas para navegación - filtro más flexible
  const navigationScreens = screens.filter(screen => {
    const hasRoute = screen.ruta || screen.codigo; // Usar código como fallback si no hay ruta
    const isActive = screen.activo !== false; // Considerar activo por defecto
    const result = hasRoute && isActive;
    
    // Debug: Mostrar qué pantallas se incluyen/excluyen y por qué
    console.log(`Screen ${screen.codigo}:`, {
      hasRoute,
      isActive,
      result,
      ruta: screen.ruta,
      activo: screen.activo
    });
    
    return result;
  });
  
  console.log('DynamicNavigation: Navigation screens after filter:', navigationScreens);
  
  // Agrupar pantallas por módulo
  const screensByModule = navigationScreens.reduce((acc, screen) => {
    const module = screen.modulo || 'General';
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(screen);
    return acc;
  }, {} as Record<string, Screen[]>);

  // Si no hay módulos múltiples, mostrar lista simple
  const hasMultipleModules = Object.keys(screensByModule).length > 1;

  return (
    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      {hasMultipleModules ? (
        // Vista agrupada por módulos
        Object.entries(screensByModule).map(([moduleName, moduleScreens]) => (
          <NavigationModule
            key={moduleName}
            moduleName={moduleName}
            screens={moduleScreens}
            defaultExpanded={moduleName === 'General'}
          />
        ))
      ) : (
        // Vista simple si solo hay un módulo
        navigationScreens.map((screen) => (
          <NavigationItem key={screen.codigo} screen={screen} />
        ))
      )}
      
      {navigationScreens.length === 0 && (
        <div className="px-3 py-8 text-center">
          <Home className="w-12 h-12 text-sidebar-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-sidebar-foreground/60">
            No hay pantallas disponibles para navegación
          </p>
          <p className="text-xs text-sidebar-foreground/40 mt-1">
            Las pantallas no tienen ruta configurada
          </p>
        </div>
      )}
    </nav>
  );
};

export default DynamicNavigation;
