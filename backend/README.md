# Backend - Sistema CRM

## Estructura de Carpetas del Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración de conexión a BD
│   │   ├── environment.js       # Variables de entorno
│   │   └── cors.js              # Configuración CORS
│   │
│   ├── models/
│   │   ├── Cliente.js           # Modelo de Clientes
│   │   ├── ClienteHistorial.js  # Historial de cambios de clientes
│   │   ├── ContactoCliente.js   # Contactos de clientes
│   │   ├── Usuario.js           # Modelo de Usuarios
│   │   ├── Departamento.js      # Departamentos
│   │   ├── Rol.js               # Roles de usuario
│   │   ├── Permiso.js           # Permisos del sistema
│   │   ├── RolPermiso.js        # Relación Rol-Permiso
│   │   ├── AuditoriaOperacion.js # Auditoría de operaciones
│   │   └── AuditoriaAcceso.js   # Auditoría de accesos
│   │
│   ├── controllers/
│   │   ├── auth.controller.js         # Autenticación y login
│   │   ├── clientes.controller.js     # CRUD Clientes
│   │   ├── usuarios.controller.js     # CRUD Usuarios
│   │   ├── departamentos.controller.js # CRUD Departamentos
│   │   ├── roles.controller.js        # CRUD Roles
│   │   ├── permisos.controller.js     # Gestión de Permisos
│   │   └── auditoria.controller.js    # Consultas de Auditoría
│   │
│   ├── routes/
│   │   ├── index.js             # Router principal
│   │   ├── auth.routes.js       # Rutas de autenticación
│   │   ├── clientes.routes.js   # Rutas de clientes
│   │   ├── usuarios.routes.js   # Rutas de usuarios
│   │   ├── departamentos.routes.js # Rutas de departamentos
│   │   ├── roles.routes.js      # Rutas de roles
│   │   └── auditoria.routes.js  # Rutas de auditoría
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js   # Verificación de JWT
│   │   ├── permission.middleware.js # Verificación de permisos
│   │   ├── audit.middleware.js  # Registro de auditoría
│   │   ├── validation.middleware.js # Validación de datos
│   │   └── error.middleware.js  # Manejo de errores
│   │
│   ├── services/
│   │   ├── auth.service.js      # Lógica de autenticación
│   │   ├── cliente.service.js   # Lógica de negocio clientes
│   │   ├── usuario.service.js   # Lógica de negocio usuarios
│   │   ├── email.service.js     # Envío de correos
│   │   └── audit.service.js     # Servicio de auditoría
│   │
│   ├── utils/
│   │   ├── jwt.utils.js         # Utilidades JWT
│   │   ├── hash.utils.js        # Encriptación de contraseñas
│   │   ├── response.utils.js    # Formateador de respuestas
│   │   └── pagination.utils.js  # Utilidades de paginación
│   │
│   ├── validations/
│   │   ├── cliente.validation.js    # Esquemas Zod para clientes
│   │   ├── usuario.validation.js    # Esquemas Zod para usuarios
│   │   └── auth.validation.js       # Esquemas Zod para auth
│   │
│   └── app.js                   # Configuración de Express
│
├── database/
│   ├── migrations/              # Migraciones de BD
│   │   ├── 001_create_departamentos.sql
│   │   ├── 002_create_roles.sql
│   │   ├── 003_create_permisos.sql
│   │   ├── 004_create_usuarios.sql
│   │   ├── 005_create_clientes.sql
│   │   └── ...
│   │
│   ├── seeds/                   # Datos iniciales
│   │   ├── departamentos.seed.js
│   │   ├── roles.seed.js
│   │   └── admin.seed.js
│   │
│   └── schema.sql               # Esquema completo de BD
│
├── tests/
│   ├── unit/                    # Tests unitarios
│   ├── integration/             # Tests de integración
│   └── e2e/                     # Tests end-to-end
│
├── logs/                        # Logs de la aplicación
│
├── .env.example                 # Variables de entorno ejemplo
├── package.json
├── server.js                    # Punto de entrada
└── README.md
```

## Tecnologías Recomendadas

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **ORM**: Prisma o Sequelize
- **Base de Datos**: PostgreSQL / MySQL
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod
- **Documentación API**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

## Endpoints API Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh` - Refrescar token
- `POST /api/auth/forgot-password` - Recuperar contraseña

### Clientes
- `GET /api/clientes` - Listar clientes (paginado)
- `GET /api/clientes/:id` - Obtener cliente
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente
- `GET /api/clientes/:id/contactos` - Listar contactos
- `GET /api/clientes/:id/historial` - Ver historial

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:id` - Obtener usuario
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Departamentos
- `GET /api/departamentos` - Listar departamentos
- `POST /api/departamentos` - Crear departamento
- `PUT /api/departamentos/:id` - Actualizar departamento
- `DELETE /api/departamentos/:id` - Eliminar departamento

### Roles y Permisos
- `GET /api/roles` - Listar roles
- `POST /api/roles` - Crear rol
- `PUT /api/roles/:id` - Actualizar rol
- `GET /api/roles/:id/permisos` - Ver permisos de rol
- `POST /api/roles/:id/permisos` - Asignar permisos

### Auditoría
- `GET /api/auditoria/operaciones` - Log de operaciones
- `GET /api/auditoria/accesos` - Log de accesos

## Variables de Entorno (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_sistema
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (opcional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
```

## Instalación

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```
