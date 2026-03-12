// services/permissionsService.js
class PermissionsService {
  constructor() {
    this.userScreens = [];
    this.permissionsLoaded = false;
  }

  normalizePath(path) {
    if (!path) return '/';
    const withSlash = path.startsWith('/') ? path : `/${path}`;
    const normalized = withSlash.replace(/\/+$/, '');
    return normalized || '/';
  }
 
  // Cargar pantallas del usuario
  async loadUserScreens() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/pantallas-usuario/', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      this.userScreens = data.pantallas || [];
      this.permissionsLoaded = true;
      return this.userScreens;
    } catch (error) {
      console.error('Error cargando pantallas:', error);
      this.userScreens = [];
      this.permissionsLoaded = true;
      return [];
    }
  }
 
  // Verificar acceso a pantalla específica
  async checkScreenAccess(screenCode) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/verificar-acceso-pantalla/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo: screenCode })
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data.accesos && data.accesos[screenCode] || false;
    } catch (error) {
      console.error('Error verificando acceso:', error);
      return false;
    }
  }
 
  // Verificar si tiene acceso (método síncrono)
  hasAccess(screenCode) {
    if (!this.permissionsLoaded) return false;
    return this.userScreens.some(screen => screen.codigo === screenCode);
  }

  hasAccessAny(screenCodes) {
    if (!this.permissionsLoaded) return false;
    return screenCodes.some(code => this.hasAccess(code));
  }

  hasPathAccess(pathname) {
    if (!this.permissionsLoaded) return false;
    const currentPath = this.normalizePath(pathname);

    return this.userScreens.some(screen => {
      if (screen.activo === false) return false;
      const routePath = screen.ruta ? this.normalizePath(screen.ruta) : null;
      const codePath = screen.codigo ? this.normalizePath(screen.codigo) : null;
      return routePath === currentPath || codePath === currentPath;
    });
  }
 
  // Obtener pantallas por módulo
  getScreensByModule(module) {
    if (!this.permissionsLoaded) return [];
    return this.userScreens.filter(screen => screen.modulo === module);
  }
 
  // Obtener todas las pantallas para menú de navegación
  getNavigationScreens() {
    if (!this.permissionsLoaded) return [];
    return this.userScreens.filter(screen => screen.ruta && screen.activo);
  }

  // Limpiar caché de permisos
  clearPermissions() {
    this.userScreens = [];
    this.permissionsLoaded = false;
  }

  // Refrescar permisos
  async refreshPermissions() {
    this.clearPermissions();
    return await this.loadUserScreens();
  }
}
 
export const permissionsService = new PermissionsService();
