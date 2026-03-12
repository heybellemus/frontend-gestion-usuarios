import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { rbacApi } from '../services/rbacApi';
import {
  Home,
  Users,
  Building2,
  UserCircle,
  Shield,
  FileText,
  Settings,
  Bell,
  Package,
  Tag,
  Scale,
  Archive,
  Truck,
  Move,
  Database,
} from 'lucide-react';

const iconMap = {
  dashboard: Home,
  clientes: Users,
  usuarios: UserCircle,
  departamentos: Building2,
  roles: Shield,
  auditoria: FileText,
  permisos: Shield,
  rolpermisos: Shield,
  notificaciones: Bell,
  configuracion: Settings,
  'menu-maestros': Settings,
  'menu-productos': Package,
  'menu-categorias': Tag,
  'menu-unidades-medida': Scale,
  'menu-lotes': Archive,
  'menu-proveedores': Truck,
  'menu-tipos-movimientos': Move,
  'menu-clientes': Users,
  'menu-departamentos': Building2,
  'menu-roles': Shield,
  'pantallas-admin': Settings,
  'admin-panel': Settings,
  'roles-admin': Shield,
  'rolpantallas-admin': Shield,
  'verificacion-acceso': Shield,
  'gestion-pantallas-rol': Shield,
};

const DynamicNavigation = () => {
  const { screens, loading } = usePermissions();
  const { user } = useAuth();

  // Debug: Ver qué pantallas se están cargando
  console.log('DynamicNavigation - Screens:', screens);
  console.log('DynamicNavigation - Loading:', loading);
  console.log('DynamicNavigation - User:', user);

  const hasAdminRole = (source) => {
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

  const isAdmin = hasAdminRole(user) || rbacApi.getCachedIsAdmin() === true;
  const adminOnlyRoutes = new Set([
    '/admin-panel',
    '/pantallas-admin',
    '/roles-admin',
    '/rolpantallas-admin',
    '/verificacion-acceso',
    '/gestion-pantallas-rol'
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm">Cargando navegacion...</span>
      </div>
    );
  }

  const seenRoutes = new Set();
  const navigationScreens = screens.filter((screen) => {
    const hasRoute = Boolean(screen.ruta || screen.codigo);
    const isActive = screen.activo !== false;
    const route = screen.ruta || `/${screen.codigo}`;
    const isAdminOnly = adminOnlyRoutes.has(route);
    if (!hasRoute || !isActive || (isAdminOnly && !isAdmin)) return false;
    if (seenRoutes.has(route)) return false;
    seenRoutes.add(route);
    return true;
  });

  // Menú de respaldo si no hay pantallas configuradas
  const fallbackScreens = [
    { codigo: 'dashboard', nombre: 'Dashboard', ruta: '/dashboard' },
    { codigo: 'menu-maestros', nombre: 'Menú Maestros', ruta: '/menu-maestros' },
    { codigo: 'menu-productos', nombre: 'Productos', ruta: '/menu-productos' },
    { codigo: 'menu-categorias', nombre: 'Categorías', ruta: '/menu-categorias' },
    { codigo: 'menu-unidades-medida', nombre: 'Unidades Medida', ruta: '/menu-unidades-medidas' },
    { codigo: 'menu-lotes', nombre: 'Lotes', ruta: '/menu-lotes' },
    { codigo: 'menu-proveedores', nombre: 'Proveedores', ruta: '/menu-proveedores' },
    { codigo: 'menu-tipos-movimientos', nombre: 'Tipos Movimientos', ruta: '/menu-tipos-movimientos' },
    { codigo: 'menu-clientes', nombre: 'Clientes', ruta: '/menu-clientes' },
    { codigo: 'menu-departamentos', nombre: 'Departamentos', ruta: '/menu-departamentos' },
    { codigo: 'menu-roles', nombre: 'Roles', ruta: '/menu-roles' },
    { codigo: 'pantallas-admin', nombre: 'Admin Pantallas', ruta: '/pantallas-admin' },
    { codigo: 'gestion-pantallas-rol', nombre: 'Gestión Pantallas Rol', ruta: '/gestion-pantallas-rol' },
    { codigo: 'clientes', nombre: 'Clientes CRUD', ruta: '/clientes' },
    { codigo: 'usuarios', nombre: 'Usuarios', ruta: '/usuarios' },
    { codigo: 'departamentos', nombre: 'Departamentos CRUD', ruta: '/departamentos' },
    { codigo: 'roles', nombre: 'Roles CRUD', ruta: '/roles' },
    { codigo: 'auditoria', nombre: 'Auditoría', ruta: '/auditoria' },
  ];

  const displayScreens = navigationScreens.length > 0 ? navigationScreens : fallbackScreens;

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {displayScreens.map((screen, index) => {
        const IconComponent = iconMap[screen.codigo] || Home;

        return (
          <NavLink
            key={`${screen.id || screen.codigo || 'screen'}-${index}`}
            to={screen.ruta || `/${screen.codigo}`}
            className={({ isActive }) =>
              `nav-link flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <IconComponent className="w-5 h-5" />
            <span className="text-sm font-medium">{screen.nombre}</span>
          </NavLink>
        );
      })}

      {displayScreens.length === 0 && (
        <div className="px-3 py-2 text-sm text-sidebar-foreground/60">
          No hay pantallas disponibles
        </div>
      )}
    </nav>
  );
};

export default DynamicNavigation;
