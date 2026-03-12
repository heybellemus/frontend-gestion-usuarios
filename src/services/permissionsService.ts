interface Screen {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
  ruta?: string;
  activo: boolean;
  descripcion?: string;
}

interface UserScreensResponse {
  pantallas: Screen[];
}

interface AccessCheckResponse {
  accesos: Record<string, boolean>;
}

class PermissionsService {
  private userScreens: Screen[] = [];
  private permissionsLoaded = false;

  private normalizePath(path: string): string {
    if (!path) return '/';
    const withSlash = path.startsWith('/') ? path : `/${path}`;
    const normalized = withSlash.replace(/\/+$/, '');
    return normalized || '/';
  }

  async loadUserScreens(): Promise<Screen[]> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('/pantallas-usuario/', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UserScreensResponse = await response.json();
      this.userScreens = data.pantallas;
      this.permissionsLoaded = true;
      return data.pantallas;
    } catch (error) {
      console.error('Error cargando pantallas:', error);
      this.userScreens = [];
      this.permissionsLoaded = false;
      return [];
    }
  }

  async checkScreenAccess(screenCode: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return false;
      }

      const response = await fetch('/verificar-acceso-pantalla/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo: screenCode })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AccessCheckResponse = await response.json();
      return data.accesos[screenCode] || false;
    } catch (error) {
      console.error('Error verificando acceso:', error);
      return false;
    }
  }

  hasAccess(screenCode: string): boolean {
    if (!this.permissionsLoaded) return false;
    return this.userScreens.some(screen => screen.codigo === screenCode);
  }

  hasAccessAny(screenCodes: string[]): boolean {
    if (!this.permissionsLoaded) return false;
    return screenCodes.some(code => this.hasAccess(code));
  }

  hasPathAccess(pathname: string): boolean {
    if (!this.permissionsLoaded) return false;
    const currentPath = this.normalizePath(pathname);

    return this.userScreens.some(screen => {
      if (screen.activo === false) return false;
      const routePath = screen.ruta ? this.normalizePath(screen.ruta) : null;
      const codePath = screen.codigo ? this.normalizePath(screen.codigo) : null;
      return routePath === currentPath || codePath === currentPath;
    });
  }

  getScreensByModule(module: string): Screen[] {
    if (!this.permissionsLoaded) return [];
    return this.userScreens.filter(screen => screen.modulo === module);
  }

  getNavigationScreens(): Screen[] {
    if (!this.permissionsLoaded) return [];
    return this.userScreens.filter(screen => screen.ruta && screen.activo);
  }

  getAllScreens(): Screen[] {
    return [...this.userScreens];
  }

  isLoaded(): boolean {
    return this.permissionsLoaded;
  }

  clearPermissions(): void {
    this.userScreens = [];
    this.permissionsLoaded = false;
  }
}

export const permissionsService = new PermissionsService();
export type { Screen };
