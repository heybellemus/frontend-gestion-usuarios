const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true, // Usar en Azure
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolConnection = null;

const getConnection = async () => {
  try {
    if (poolConnection) {
      return poolConnection;
    }
    
    poolConnection = await sql.connect(config);
    console.log('✅ Conexión a SQL Server establecida');
    return poolConnection;
  } catch (error) {
    console.error('❌ Error al conectar con SQL Server:', error.message);
    throw error;
  }
};

module.exports = {
  sql,
  getConnection,
  closeConnection: async () => {
    try {
      if (poolConnection) {
        await poolConnection.close();
        poolConnection = null;
        console.log('🔌 Conexión cerrada');
      }
    } catch (error) {
      console.error('Error al cerrar conexión:', error);
    }
  }
};