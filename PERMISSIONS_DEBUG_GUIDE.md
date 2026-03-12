# Guía de Debug para Sistema de Permisos

## 🔍 Pasos para Verificar que el Sistema Funciona

### 1. Verificar Conexión con Backend

Abre el navegador y prueba las APIs directamente:

```bash
# Después de hacer login, obtén el token de localStorage
token = localStorage.getItem('authToken')

# Prueba la API de pantallas de usuario
fetch('/pantallas-usuario/', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json()).then(console.log)

# Prueba verificación de acceso específico
fetch('/verificar-acceso-pantalla/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ codigo: 'dashboard' })
}).then(r => r.json()).then(console.log)
```

### 2. Revisar Console Logs

El sistema ahora incluye logs para debug:

1. **Login**: Busca "Loading user permissions after login..."
2. **ProtectedRoute**: Busca "ProtectedRoute: Loading permissions for screen:"
3. **Permisos cargados**: Busca "Permissions loaded successfully"

### 3. Verificar Estado en Runtime

Abre DevTools y ejecuta:

```javascript
// Verificar si los permisos están cargados
permissionsService.isLoaded()

// Ver todas las pantallas del usuario
permissionsService.getAllScreens()

// Ver acceso a pantalla específica
permissionsService.hasAccess('dashboard')

// Ver pantallas de navegación
permissionsService.getNavigationScreens()
```

### 4. Problemas Comunes y Soluciones

#### Problema: "No hay pantallas disponibles" en el menú
**Causa**: La API no devuelve datos o el formato es incorrecto.
**Solución**:
1. Verifica que el backend esté corriendo
2. Revisa la respuesta de `/pantallas-usuario/`
3. Verifica que las pantallas tengan `ruta` y `activo: true`

#### Problema: Acceso denegado a todas las pantallas
**Causa**: Token incorrecto o permisos no cargados.
**Solución**:
1. Verifica que `localStorage.getItem('authToken')` tenga valor
2. Revisa los logs de error en consola
3. Prueba hacer logout y login nuevamente

#### Problema: El menú muestra todas las pantallas (ignora permisos)
**Causa**: DashboardLayout no está usando DynamicNavigation.
**Solución**: Verifica que `DashboardLayout.jsx` importe y use `<DynamicNavigation />`

### 5. Formato Esperado de la API

La API `/pantallas-usuario/` debe devolver:

```json
{
  "pantallas": [
    {
      "id": 1,
      "codigo": "dashboard",
      "nombre": "Panel Principal",
      "modulo": "General",
      "ruta": "/dashboard",
      "activo": true,
      "descripcion": "Pantalla principal"
    },
    {
      "id": 2,
      "codigo": "clientes_list",
      "nombre": "Listado de Clientes",
      "modulo": "Clientes",
      "ruta": "/clientes",
      "activo": true
    }
  ]
}
```

### 6. Test con Diferentes Roles

1. Crea usuarios con diferentes roles en el backend
2. Asigna diferentes permisos a cada rol
3. Prueba el login con cada usuario
4. Verifica que solo vean las pantallas correspondientes

### 7. Logs Esperados

Si todo funciona correctamente, deberías ver en consola:

```
Loading user permissions after login...
Permissions loaded successfully
ProtectedRoute: Loading permissions for screen: dashboard
ProtectedRoute: Access check for dashboard: true
```

### 8. Si Sigue Sin Funcionar

1. **Verifica CORS**: Asegúrate que el backend permita requests desde tu frontend
2. **Revisa rutas**: Verifica que las URLs en `vite.config.ts` apunten al backend correcto
3. **Formato de token**: Algunos backends usan "Token" en lugar de "Bearer"
4. **Headers adicionales**: Algunas APIs requieren headers específicos

### 9. Modo Desarrollo

Para debug adicional, puedes modificar temporalmente `PermissionsService`:

```typescript
// En permissionsService.ts, añade logs
console.log('Token encontrado:', !!token);
console.log('Response status:', response.status);
console.log('Response data:', data);
```

### 10. Verificación Final

Después de login, ejecuta en consola:

```javascript
// Debería mostrar true
permissionsService.isLoaded()

// Debería mostrar las pantallas del usuario
permissionsService.getAllScreens()

// Debería mostrar true para pantallas permitidas
permissionsService.hasAccess('dashboard')
```

Si todos estos pasos funcionan, el sistema de permisos está operativo.
