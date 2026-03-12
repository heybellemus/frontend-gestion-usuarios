# Sistema de Permisos - Guía de Uso

## Overview

Se ha implementado un sistema completo de permisos para el frontend que se integra con el backend Django. El sistema controla el acceso a pantallas y funcionalidades basado en los roles y permisos del usuario.

## Componentes Implementados

### 1. PermissionsService (`src/services/permissionsService.ts`)
Servicio centralizado para gestionar permisos de usuario.

**Métodos principales:**
- `loadUserScreens()`: Carga las pantallas accesibles del usuario
- `checkScreenAccess(screenCode)`: Verifica acceso a una pantalla específica
- `hasAccess(screenCode)`: Verificación síncrona de acceso
- `getScreensByModule(module)`: Obtiene pantallas por módulo
- `getNavigationScreens()`: Obtiene pantallas para navegación

### 2. usePermissions Hook (`src/hooks/usePermissions.ts`)
Hook personalizado para manejar estado de permisos en componentes.

**Uso:**
```typescript
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const { hasAccess, loading, screens, refreshPermissions } = usePermissions();
  
  if (loading) return <div>Cargando...</div>;
  
  if (hasAccess('clientes_create')) {
    // Mostrar contenido
  }
};
```

### 3. ProtectedRoute Component (`src/components/ProtectedRoute.tsx`)
Componente para proteger rutas basado en permisos.

**Uso:**
```typescript
<ProtectedRoute screenCode="dashboard">
  <Dashboard />
</ProtectedRoute>
```

### 4. DynamicNavigation Component (`src/components/DynamicNavigation.tsx`)
Genera menú de navegación dinámico basado en permisos.

**Características:**
- Agrupación por módulos
- Iconos automáticos
- Estados de carga y error
- Diseño responsive

### 5. ConditionalButton Component (`src/components/ConditionalButton.tsx`)
Botón que se muestra/oculta basado en permisos.

**Uso:**
```typescript
<ConditionalButton 
  screenCode="clientes_create"
  onClick={handleCreate}
  variant="default"
>
  Nuevo Cliente
</ConditionalButton>
```

### 6. PermissionsContext (`src/context/PermissionsContext.tsx`)
Contexto global para manejar estado de permisos.

**Hooks adicionales:**
- `usePermissionsContext()`: Acceso al contexto
- `usePermission(screenCode)`: Verificación individual
- `useMultiplePermissions(codes)`: Verificación múltiple

## Configuración de Rutas

Las rutas están configuradas en `App.tsx` con códigos de pantalla específicos:

```typescript
<Route path="clientes" element={
  <ProtectedRoute screenCode="clientes_list">
    <Clientes />
  </ProtectedRoute>
} />
```

## Códigos de Pantalla Comunes

| Código | Descripción |
|--------|-------------|
| `dashboard` | Panel principal |
| `clientes_list` | Listado de clientes |
| `clientes_create` | Crear clientes |
| `clientes_edit` | Editar clientes |
| `usuarios_list` | Listado de usuarios |
| `usuarios_create` | Crear usuarios |
| `usuarios_edit` | Editar usuarios |
| `departamentos_list` | Listado de departamentos |
| `roles_list` | Listado de roles |
| `roles_manage` | Gestionar roles |
| `permisos_manage` | Gestionar permisos |
| `rolpermisos_manage` | Gestionar permisos de rol |
| `auditoria_view` | Ver auditoría |
| `qr_scanner` | Escáner QR |

## Ejemplos de Uso

### 1. Proteger Componentes
```typescript
import { ProtectedRoute } from '../components/ProtectedRoute';

const ClientesPage = () => {
  return (
    <ProtectedRoute screenCode="clientes_list">
      <ClientesList />
    </ProtectedRoute>
  );
};
```

### 2. Botones Condicionales
```typescript
import ConditionalButton from '../components/ConditionalButton';

const ClientesList = () => {
  const handleCreate = () => {
    // Lógica para crear cliente
  };

  return (
    <div>
      <ConditionalButton 
        screenCode="clientes_create"
        onClick={handleCreate}
        className="btn-primary"
      >
        Nuevo Cliente
      </ConditionalButton>
    </div>
  );
};
```

### 3. Verificación Manual
```typescript
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const { hasAccess } = usePermissions();

  return (
    <div>
      {hasAccess('usuarios_edit') && (
        <button>Editar Usuario</button>
      )}
    </div>
  );
};
```

### 4. Múltiples Permisos
```typescript
import { useMultiplePermissions } from '../context/PermissionsContext';

const AdminPanel = () => {
  const permissions = useMultiplePermissions([
    'usuarios_manage',
    'roles_manage',
    'permisos_manage'
  ]);

  const hasAdminAccess = Object.values(permissions).some(Boolean);

  if (!hasAdminAccess) return <AccessDenied />;

  return <AdminContent />;
};
```

## Integración con Backend

### APIs Esperadas

1. **GET /pantallas-usuario/**
   - Obtiene pantallas accesibles del usuario actual
   - Headers: `Authorization: Bearer <token>`
   - Response: `{ "pantallas": [...] }`

2. **POST /verificar-acceso-pantalla/**
   - Verifica acceso a pantalla específica
   - Body: `{ "codigo": "screen_code" }`
   - Response: `{ "accesos": { "screen_code": true/false } }`

### Formato de Pantalla
```typescript
interface Screen {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
  ruta?: string;
  activo: boolean;
  descripcion?: string;
}
```

## Manejo de Errores

El sistema incluye manejo robusto de errores:
- Loading states durante carga de permisos
- Mensajes de acceso denegado
- Fallbacks para componentes no autorizados
- Logging de errores en consola

## Mejores Prácticas

1. **Usar códigos descriptivos**: `clientes_create` en lugar de `cc`
2. **Proteger tanto rutas como acciones**: No solo proteger la ruta, sino también los botones y acciones dentro
3. **Manejar estados de carga**: Mostrar indicadores mientras se verifican permisos
4. **Refresh de permisos**: Implementar refresh cuando cambien roles o permisos
5. **Testing**: Probar diferentes roles y escenarios de permisos

## Troubleshooting

### Problemas Comunes

1. **Permisos no cargan**
   - Verificar token en localStorage
   - Verificar conexión con backend
   - Revisar consola para errores

2. **Acceso denegado inesperado**
   - Verificar código de pantalla correcto
   - Confirmar permisos en backend
   - Refrescar permisos manualmente

3. **Menú no muestra items**
   - Verificar que las pantallas tengan `ruta` y `activo: true`
   - Revisar agrupación por módulos

### Debug Tips

```typescript
// Para debug: Ver todos los permisos cargados
const { screens } = usePermissions();
console.log('Pantallas cargadas:', screens);

// Para debug: Verificar acceso específico
const { hasAccess } = usePermissions();
console.log('Tiene acceso a dashboard:', hasAccess('dashboard'));
```

## Actualización Futura

Para agregar nuevas pantallas:
1. Agregar código de pantalla en backend
2. Asignar permisos a roles
3. Usar `<ProtectedRoute screenCode="nuevo_codigo">` en rutas
4. Usar `<ConditionalButton screenCode="nuevo_codigo">` en botones
