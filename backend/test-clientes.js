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

async function testClientes() {
  let pool;
  try {
    console.log('🔍 Iniciando test de tabla Clientes...');
    console.log(`Servidor: ${config.server}`);
    console.log(`Base de datos: ${config.database}\n`);
    
    pool = await sql.connect(config);
    console.log('✅ Conexión a SQL Server exitosa!\n');
    
    // 1. Verificar si la tabla Clientes existe
    console.log('1. 📋 Verificando estructura de tabla Clientes:');
    const tableExists = await pool.request()
      .query(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Clientes'
        ORDER BY ORDINAL_POSITION
      `);
    
    if (tableExists.recordset.length === 0) {
      console.log('   ❌ La tabla Clientes NO existe en la base de datos');
      console.log('\n   💡 Ejecuta el siguiente script SQL:');
      console.log(`
        CREATE TABLE Clientes (
          ClientID INT PRIMARY KEY IDENTITY(1,1),
          TipoDocumento VARCHAR(50) NOT NULL,
          NumeroDocumento VARCHAR(50) NOT NULL,
          RazonSocial NVARCHAR(200) NOT NULL,
          NombreComercial NVARCHAR(200),
          Telefono VARCHAR(20),
          Email VARCHAR(100),
          Direccion NVARCHAR(500),
          Ciudad VARCHAR(100),
          Pais VARCHAR(100),
          Activo BIT DEFAULT 1,
          CreadoPor INT,
          FechaCreacion DATETIME DEFAULT GETDATE(),
          ModificadoPor INT,
          FechaModificacion DATETIME
        );
        
        CREATE INDEX idx_clientes_documento ON Clientes(TipoDocumento, NumeroDocumento);
        CREATE INDEX idx_clientes_razonsocial ON Clientes(RazonSocial);
      `);
    } else {
      console.log(`   ✅ Tabla Clientes encontrada (${tableExists.recordset.length} columnas)`);
      console.log('   Estructura:');
      tableExists.recordset.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
    
    // 2. Contar registros en la tabla
    console.log('\n2. 📊 Contando registros en tabla Clientes:');
    try {
      const countResult = await pool.request()
        .query('SELECT COUNT(*) as total FROM Clientes');
      console.log(`   ✅ Total de clientes: ${countResult.recordset[0].total}`);
    } catch (error) {
      console.log(`   ❌ Error al contar clientes: ${error.message}`);
    }
    
    // 3. Mostrar algunos clientes (si existen)
    console.log('\n3. 👥 Mostrando clientes (máximo 10):');
    try {
      const clientesResult = await pool.request()
        .query('SELECT TOP 10 * FROM Clientes ORDER BY ClientID');
      
      if (clientesResult.recordset.length > 0) {
        console.log(`   ✅ ${clientesResult.recordset.length} cliente(s) encontrado(s):`);
        clientesResult.recordset.forEach((cliente, index) => {
          console.log(`   ${index + 1}. ${cliente.RazonSocial} (${cliente.TipoDocumento}: ${cliente.NumeroDocumento})`);
          console.log(`      Email: ${cliente.Email || 'N/A'}, Tel: ${cliente.Telefono || 'N/A'}`);
          console.log(`      Estado: ${cliente.Activo ? 'Activo' : 'Inactivo'}`);
        });
      } else {
        console.log('   ℹ️ No hay clientes en la tabla');
      }
    } catch (error) {
      console.log(`   ❌ Error al obtener clientes: ${error.message}`);
    }
    
    // 4. Probar inserción de un cliente de prueba
    console.log('\n4. 🧪 Probando inserción de cliente de prueba:');
    try {
      // Primero verificar si ya existe el cliente de prueba
      const testDocumento = '99999999999';
      const checkResult = await pool.request()
        .input('documento', sql.VarChar, testDocumento)
        .query('SELECT COUNT(*) as existe FROM Clientes WHERE NumeroDocumento = @documento');
      
      if (checkResult.recordset[0].existe === 0) {
        const insertResult = await pool.request()
          .input('tipoDoc', sql.VarChar, 'RUC')
          .input('numDoc', sql.VarChar, testDocumento)
          .input('razonSocial', sql.NVarChar, 'CLIENTE DE PRUEBA S.A.')
          .input('telefono', sql.VarChar, '999888777')
          .input('email', sql.VarChar, 'prueba@test.com')
          .input('direccion', sql.NVarChar, 'Av. Prueba 123')
          .input('ciudad', sql.VarChar, 'Lima')
          .input('pais', sql.VarChar, 'Perú')
          .query(`
            INSERT INTO Clientes (
              TipoDocumento, NumeroDocumento, RazonSocial, 
              Telefono, Email, Direccion, Ciudad, Pais, CreadoPor
            ) 
            VALUES (
              @tipoDoc, @numDoc, @razonSocial,
              @telefono, @email, @direccion, @ciudad, @pais, 1
            )
          `);
        
        if (insertResult.rowsAffected[0] > 0) {
          console.log('   ✅ Cliente de prueba insertado correctamente');
          
          // Mostrar el cliente insertado
          const nuevoCliente = await pool.request()
            .input('documento', sql.VarChar, testDocumento)
            .query('SELECT * FROM Clientes WHERE NumeroDocumento = @documento');
          
          console.log('   Datos del cliente insertado:');
          const cliente = nuevoCliente.recordset[0];
          console.log(`   - ID: ${cliente.ClientID}`);
          console.log(`   - Razon Social: ${cliente.RazonSocial}`);
          console.log(`   - Documento: ${cliente.TipoDocumento} ${cliente.NumeroDocumento}`);
          console.log(`   - Fecha Creación: ${cliente.FechaCreacion}`);
        }
      } else {
        console.log('   ℹ️ El cliente de prueba ya existe');
      }
    } catch (error) {
      console.log(`   ❌ Error al insertar cliente de prueba: ${error.message}`);
      console.log('   Detalles del error:', error);
    }
    
    // 5. Verificar API endpoints
    console.log('\n5. 🌐 Verificando API endpoints:');
    console.log('   Endpoints disponibles:');
    console.log('   - GET  http://localhost:5000/api/clientes');
    console.log('   - POST http://localhost:5000/api/clientes');
    console.log('   - GET  http://localhost:5000/api/clientes/search?term=prueba');
    console.log('\n   Para probar manualmente:');
    console.log('   curl -X GET http://localhost:5000/api/clientes');
    console.log('   curl -X POST http://localhost:5000/api/clientes \\');
    console.log('        -H "Content-Type: application/json" \\');
    console.log('        -d \'{"tipoDocumento":"RUC","numeroDocumento":"12345678901","razonSocial":"Test S.A.","telefono":"111222333","direccion":"Test 123","ciudad":"Lima","pais":"Perú"}\'');
    
    // 6. Verificar estructura de la API
    console.log('\n6. 🔧 Verificando archivos del backend:');
    const archivosNecesarios = [
      'models/cliente.model.js',
      'services/clientes.service.js',
      'controllers/clientes.controller.js',
      'routes/clientes.routes.js'
    ];
    
    console.log('   Archivos necesarios:');
    archivosNecesarios.forEach(archivo => {
      console.log(`   - ${archivo}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.log('\n🔧 Solucionar problemas:');
    console.log('1. Verifica que SQL Server esté corriendo');
    console.log('2. Verifica las credenciales en el archivo .env');
    console.log('3. Asegúrate de que la base de datos existe');
    console.log('4. Verifica que el usuario tenga permisos');
    console.log('5. Revisa el firewall si es necesario');
    
    if (error.message.includes('Login failed')) {
      console.log('\n🔑 Problema de autenticación:');
      console.log('   - Verifica usuario y contraseña');
      console.log('   - Prueba con autenticación de Windows');
      console.log('   - Asegúrate que el usuario SA está habilitado');
    }
    
    if (error.message.includes('Cannot open database')) {
      console.log('\n🗄️ Problema con la base de datos:');
      console.log('   - Verifica que la base de datos existe');
      console.log('   - Ejecuta: CREATE DATABASE GestionUsuariosDB');
    }
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el test
testClientes();