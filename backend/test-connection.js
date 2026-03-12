
import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

// Separar host e instancia si DB_SERVER contiene '\'
let server = process.env.DB_SERVER;
let instanceName;
if (server && server.includes('\\')) {
  [server, instanceName] = server.split('\\');
}

const config = {
  server,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    ...(instanceName ? { instanceName } : {})
  }
};

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a SQL Server...');
    console.log(`Servidor: ${config.server}`);
    console.log(`Base de datos: ${config.database}`);
    
    await sql.connect(config);
    console.log('✅ Conexión exitosa!');
    
    // Probar consulta a la tabla Usuarios
    const result = await sql.query('SELECT COUNT(*) as total FROM Usuarios');
    console.log(`📊 Total de usuarios: ${result.recordset[0].total}`);
    
    await sql.close();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('Posibles soluciones:');
    console.log('1. Verifica que SQL Server está corriendo');
    console.log('2. Verifica las credenciales en el archivo .env');
    console.log('3. Asegúrate que la autenticación de Windows está habilitada');
    console.log('4. Verifica que la instancia SQLEXPRESS está configurada correctamente');
  }
}

testConnection();