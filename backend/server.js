require('dotenv').config();
const app = require('./src/app');

// Función para obtener la IP local automáticamente
const getLocalIp = () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  // Primero intentar obtener la IP de la red local
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Filtrar IPv4 y no internas
      if (iface.family === 'IPv4' && !iface.internal) {
        // Priorizar IPs de red local (192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x)
        if (
          iface.address.startsWith('192.168.') ||
          iface.address.startsWith('10.') ||
          iface.address.startsWith('172.16.') ||
          iface.address.startsWith('172.17.') ||
          iface.address.startsWith('172.18.') ||
          iface.address.startsWith('172.19.') ||
          iface.address.startsWith('172.20.') ||
          iface.address.startsWith('172.21.') ||
          iface.address.startsWith('172.22.') ||
          iface.address.startsWith('172.23.') ||
          iface.address.startsWith('172.24.') ||
          iface.address.startsWith('172.25.') ||
          iface.address.startsWith('172.26.') ||
          iface.address.startsWith('172.27.') ||
          iface.address.startsWith('172.28.') ||
          iface.address.startsWith('172.29.') ||
          iface.address.startsWith('172.30.') ||
          iface.address.startsWith('172.31.')
        ) {
          return iface.address;
        }
      }
    }
  }
  
  // Si no encuentra IP de red local, usar localhost
  return '127.0.0.1';
};

// Obtener configuración
const LOCAL_IP = getLocalIp();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // IMPORTANTE: Escuchar en todas las interfaces

// Información de la base de datos (para log)
const dbInfo = {
  name: process.env.DB_NAME || 'No configurada',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '1433'
};

// Mostrar información detallada
console.clear();
console.log('\n' + '='.repeat(70));
console.log('🚀 SERVIDOR BACKEND - CONFIGURACIÓN PARA ACCESO DESDE MÓVIL');
console.log('='.repeat(70));

console.log('\n📡 CONFIGURACIÓN DE RED:');
console.log('   • IP Local Detectada:', LOCAL_IP);
console.log('   • Puerto:', PORT);
console.log('   • Host:', HOST);
console.log('   • Modo:', process.env.NODE_ENV || 'development');

console.log('\n🗄️  BASE DE DATOS:');
console.log('   • Nombre:', dbInfo.name);
console.log('   • Host:', dbInfo.host);
console.log('   • Puerto:', dbInfo.port);

console.log('\n🔗 URLs DE ACCESO AL BACKEND:');
console.log('   👉 Desde tu PC:');
console.log('      • http://localhost:' + PORT);
console.log('      • http://127.0.0.1:' + PORT);
console.log('      • http://' + LOCAL_IP + ':' + PORT);
console.log('\n   📱 Desde tu MÓVIL (misma WiFi):');
console.log('      • http://' + LOCAL_IP + ':' + PORT);
console.log('      • http://192.168.0.9:' + PORT + ' (IP específica)');

console.log('\n🔧 RUTAS DE PRUEBA:');
console.log('   • Health Check: http://' + LOCAL_IP + ':' + PORT + '/api/health');
console.log('   • CORS Test: http://' + LOCAL_IP + ':' + PORT + '/api/cors-test');
console.log('   • Server Info: http://' + LOCAL_IP + ':' + PORT + '/api/server-info');

console.log('\n💡 INSTRUCCIONES PARA EL FRONTEND:');
console.log('   1. Tu frontend debe usar esta URL base:');
console.log('      const API_URL = \'http://' + LOCAL_IP + ':' + PORT + '\';');
console.log('   2. O mejor, dinámica:');
console.log('      const API_URL = `http://${window.location.hostname}:' + PORT + '`;');

console.log('\n' + '='.repeat(70));
console.log('🔄 Iniciando servidor...\n');

// Iniciar servidor - ¡IMPORTANTE usar HOST = '0.0.0.0'!
app.listen(PORT, HOST, () => {
  console.log('✅ Servidor iniciado correctamente');
  console.log('✅ Escuchando en todas las interfaces de red');
  console.log('✅ CORS configurado para desarrollo');
  console.log('\n🎯 PRUEBA INMEDIATA DESDE TU MÓVIL:');
  console.log('   Abre el navegador y visita:');
  console.log('   http://' + LOCAL_IP + ':' + PORT + '/api/health');
  console.log('\n' + '='.repeat(70));
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('\n❌ ERROR NO CAPTURADO:', error.message);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ PROMESA RECHAZADA NO MANEJADA:', reason);
});

// Mostrar banner después de iniciar
setTimeout(() => {
  console.log('\n✨ TIPS PARA SOLUCIONAR PROBLEMAS:');
  console.log('   1. Si no funciona desde móvil, verifica firewall:');
  console.log('      netsh advfirewall firewall add rule name="NodeJS" dir=in action=allow protocol=TCP localport=' + PORT);
  console.log('   2. Verifica que estás en la misma red WiFi');
  console.log('   3. En el frontend, NO uses "localhost", usa la IP: ' + LOCAL_IP);
  console.log('   4. Prueba primero desde el móvil: http://' + LOCAL_IP + ':' + PORT + '/api/health');
  console.log('\n' + '='.repeat(70));
}, 1000);