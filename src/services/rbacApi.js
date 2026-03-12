// Centralized RBAC API client using backend endpoints defined by the project.
const API_BASE = 'http://127.0.0.1:8000';

const ENDPOINTS = {
  login: `${API_BASE}/login/`,
  userScreens: `${API_BASE}/pantallas-usuario/`,
  allScreens: `${API_BASE}/pantallas-list/`,
  verifyAccess: `${API_BASE}/verificar-acceso-pantalla/`,
  roleScreens: (roleId) => `${API_BASE}/rol-pantallas/${roleId}/`,
  assignRoleScreen: `${API_BASE}/asignar-pantalla-rol/`,
};

const normalizePath = (path) => {
  if (!path) return '/';
  const prefixed = path.startsWith('/') ? path : `/${path}`;
  const normalized = prefixed.replace(/\/+$/, '');
  return normalized || '/';
};

const getToken = () => localStorage.getItem('authToken');

const decodeTokenPayload = () => {
  try {
    const token = getToken();
    if (!token) return {};
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    return JSON.parse(atob(parts[1]));
  } catch {
    return {};
  }
};

const getHeaders = (isJson = true) => {
  const token = getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

const readCache = (key) => {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeCache = (key, value) => {
  sessionStorage.setItem(key, JSON.stringify(value));
};

const getTokenCacheKey = (suffix) => {
  const token = getToken() || 'anonymous';
  let identity = token;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      identity = String(
        payload.user_id ||
        payload.id ||
        payload.sub ||
        token
      );
    }
  } catch {
    identity = token;
  }
  return `rbac_${suffix}_${identity}`;
};

export const rbacApi = {
  ENDPOINTS,

  clearCache() {
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith('rbac_'));
    keys.forEach((k) => sessionStorage.removeItem(k));
  },

  async fetchUserScreens(force = false) {
    const cacheKey = getTokenCacheKey('user_screens');
    if (!force) {
      const cached = readCache(cacheKey);
      if (cached && Array.isArray(cached)) return cached;
    }

    const response = await fetch(ENDPOINTS.userScreens, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`pantallas-usuario error ${response.status}`);
    }

    const data = await response.json();
    const screens = Array.isArray(data) ? data : (data.pantallas || data.results || []);
    writeCache(cacheKey, screens);
    return screens;
  },

  async isAdmin(force = false) {
    const cacheKey = getTokenCacheKey('is_admin');
    if (!force) {
      const cached = readCache(cacheKey);
      if (typeof cached === 'boolean') return cached;
    }

    const payload = decodeTokenPayload();
    const roleName =
      payload.rol ||
      payload.role ||
      payload.nombre_rol ||
      payload.rol_nombre ||
      payload.role_name ||
      payload.group;

    const adminFromToken = (
      Number(payload.rolid) === 1 ||
      Number(payload.rol_id) === 1 ||
      Number(payload.role_id) === 1 ||
      payload.is_superuser === true ||
      payload.is_staff === true ||
      (typeof roleName === 'string' && roleName.toLowerCase().includes('admin'))
    );

    if (adminFromToken) {
      writeCache(cacheKey, true);
      return true;
    }

    try {
      const response = await fetch(ENDPOINTS.allScreens, {
        method: 'GET',
        headers: getHeaders(),
      });

      const admin = response.ok;
      writeCache(cacheKey, admin);
      return admin;
    } catch {
      writeCache(cacheKey, false);
      return false;
    }
  },

  getCachedIsAdmin() {
    const cacheKey = getTokenCacheKey('is_admin');
    const cached = readCache(cacheKey);
    return typeof cached === 'boolean' ? cached : null;
  },

  async verifyAccess(codigos) {
    const response = await fetch(ENDPOINTS.verifyAccess, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ codigos }),
    });

    if (!response.ok) {
      throw new Error(`verificar-acceso-pantalla error ${response.status}`);
    }

    const data = await response.json();
    const accesos = data.accesos || {};
    return {
      accesos,
      allGranted: codigos.every((code) => accesos[code] === true),
      anyGranted: codigos.some((code) => accesos[code] === true),
    };
  },

  async hasPathAccess(pathname) {
    const screens = await this.fetchUserScreens();
    const currentPath = normalizePath(pathname);

    return screens.some((screen) => {
      if (screen.activo === false) return false;
      const routePath = screen.ruta ? normalizePath(screen.ruta) : null;
      const codePath = screen.codigo ? normalizePath(screen.codigo) : null;
      return routePath === currentPath || codePath === currentPath;
    });
  },
};
