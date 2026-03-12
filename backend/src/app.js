const express = require('express');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuarios.routes.js');
const departamentosRoutes = require('./routes/departamentos.routes.js');
const clientesRoutes = require('./routes/clientes.routes.js');
const rolesRoutes = require('./routes/roles.routes.js');
const permisosRoutes = require('./routes/permisos.routes.js');
const errorHandler = require('./middlewares/errorHandler.js');

const app = express();

// Obtener IP dinámicamente
const getLocalIp = () => {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.')) {
          return iface.address;
        }
      }
    }
  }
  return 'localhost';
};

const LOCAL_IP = getLocalIp();
const PORT = process.env.PORT || 8000;

console.log('🌐 Información del servidor:');
console.log(`📍 IP Local: ${LOCAL_IP}`);
console.log(`🔌 Puerto: ${PORT}`);
console.log('📱 URLs de acceso:');
console.log(`   • PC: http://localhost:${PORT}`);
console.log(`   • Móvil: http://${LOCAL_IP}:${PORT}`);

// Configuración CORS COMPLETA para desarrollo
app.use(cors({
  origin: function (origin, callback) {
    // En desarrollo, permitir todos los orígenes
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:8083',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite
      'http://127.0.0.1:5173',
      `http://${LOCAL_IP}:3000`,
      `http://${LOCAL_IP}:8080`,
      `http://${LOCAL_IP}:8081`,
      `http://${LOCAL_IP}:8082`,
      `http://${LOCAL_IP}:8083`,
      `http://${LOCAL_IP}:5173`,
      // Para tu IP específica
      'http://192.168.0.9:3000',
      'http://192.168.0.9:8080',
      'http://192.168.0.9:8081',
      'http://192.168.0.9:8082',
      'http://192.168.0.9:8083',
      'http://192.168.0.9:5173',
    ];
    
    // También permitir cualquier IP local
    const isLocalNetwork = origin && (
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('http://172.16.') ||
      origin.startsWith('http://172.17.') ||
      origin.startsWith('http://172.18.') ||
      origin.startsWith('http://172.19.') ||
      origin.startsWith('http://172.20.') ||
      origin.startsWith('http://172.21.') ||
      origin.startsWith('http://172.22.') ||
      origin.startsWith('http://172.23.') ||
      origin.startsWith('http://172.24.') ||
      origin.startsWith('http://172.25.') ||
      origin.startsWith('http://172.26.') ||
      origin.startsWith('http://172.27.') ||
      origin.startsWith('http://172.28.') ||
      origin.startsWith('http://172.29.') ||
      origin.startsWith('http://172.30.') ||
      origin.startsWith('http://172.31.')
    );
    
    if (!origin || allowedOrigins.includes(origin) || isLocalNetwork) {
      callback(null, true);
    } else {
      console.log('⚠️ Origen bloqueado por CORS:', origin);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Headers',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Content-Length', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Middleware para log de peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log(`   Origin: ${req.headers.origin || 'No origin'}`);
  console.log(`   Host: ${req.headers.host}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/departamentos', departamentosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permisos', permisosRoutes);

// Health check mejorado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend funcionando',
    timestamp: new Date().toISOString(),
    ip: LOCAL_IP,
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta para debug CORS mejorada
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin || 'No origin header',
    host: req.headers.host,
    serverIp: LOCAL_IP,
    serverPort: PORT,
    timestamp: new Date().toISOString(),
    allowed: true
  });
});

// Ruta de información del servidor
app.get('/api/server-info', (req, res) => {
  res.json({
    server: 'Node.js/Express Backend',
    ip: LOCAL_IP,
    port: PORT,
    cors: {
      enabled: true,
      mode: 'development',
      localIp: LOCAL_IP
    },
    urls: {
      local: `http://localhost:${PORT}`,
      network: `http://${LOCAL_IP}:${PORT}`,
      specific: 'http://192.168.0.9:8000'
    },
    frontend: {
      recommendedUrl: `http://${LOCAL_IP}:3000`
    }
  });
});

// Middleware para OPTIONS (preflight)
app.options('*', cors());

app.use(errorHandler);

// Función para iniciar el servidor
const startServer = () => {
  // IMPORTANTE: Escuchar en 0.0.0.0 para aceptar conexiones de red
  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SERVIDOR NODE.JS INICIADO');
    console.log('='.repeat(60));
    console.log(`📡 Escuchando en todas las interfaces (0.0.0.0)`);
    console.log(`📍 Puerto: ${PORT}`);
    console.log('\n🔗 URLs DE ACCESO:');
    console.log(`   • PC (localhost): http://localhost:${PORT}`);
    console.log(`   • PC (127.0.0.1): http://127.0.0.1:${PORT}`);
    console.log(`   • Red local: http://${LOCAL_IP}:${PORT}`);
    console.log(`   • IP específica: http://192.168.0.9:${PORT}`);
    console.log('\n📱 DESDE TU MÓVIL:');
    console.log(`   1. Conéctate a la misma WiFi`);
    console.log(`   2. Abre: http://${LOCAL_IP}:${PORT}/api/health`);
    console.log(`   3. Deberías ver {"status":"OK",...}`);
    console.log('\n🔧 RUTAS DE DIAGNÓSTICO:');
    console.log(`   • Health: http://${LOCAL_IP}:${PORT}/api/health`);
    console.log(`   • CORS Test: http://${LOCAL_IP}:${PORT}/api/cors-test`);
    console.log(`   • Server Info: http://${LOCAL_IP}:${PORT}/api/server-info`);
    console.log('='.repeat(60) + '\n');
  });
};

module.exports = { app, startServer };