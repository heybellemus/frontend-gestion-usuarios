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

async function testRoles() {
  let pool;
  try {
    console.log('🔍 Iniciando test de Roles y Permisos...');
    console.log(`Servidor: ${config.server}`);
    console.log(`Base de datos: ${config.database}\n`);
    
    pool = await sql.connect(config);
    console.log('✅ Conexión a SQL Server exitosa!\n');
    
    // 1. Verificar si las tablas existen
    console.log('1. 📋 Verificando estructura de tablas:');
    
    // Verificar tabla Roles
    const rolesTable = await pool.request()
      .query(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Roles'
        ORDER BY ORDINAL_POSITION
      `);
    
    if (rolesTable.recordset.length === 0) {
      console.log('   ❌ La tabla Roles NO existe en la base de datos');
      console.log('\n   💡 Ejecuta el siguiente script SQL:');
      console.log(`
        CREATE TABLE Roles (
          RolID INT PRIMARY KEY IDENTITY(1,1),
          Nombre NVARCHAR(100) NOT NULL,
          Descripcion NVARCHAR(500) NOT NULL,
          Activo BIT DEFAULT 1,
          CreadoPor INT,
          FechaCreacion DATETIME DEFAULT GETDATE(),
          ModificadoPor INT,
          FechaModificacion DATETIME
        );
        
        CREATE INDEX idx_roles_nombre ON Roles(Nombre);
      `);
    } else {
      console.log(`   ✅ Tabla Roles encontrada (${rolesTable.recordset.length} columnas)`);
      console.log('   Estructura:');
      rolesTable.recordset.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

    // Verificar tabla Permisos
    const permisosTable = await pool.request()
      .query(`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'Permisos'
      `);
    
    if (permisosTable.recordset[0].count === 0) {
      console.log('   ❌ La tabla Permisos NO existe');
    } else {
      console.log('   ✅ Tabla Permisos encontrada');
    }

    // Verificar tabla RolesPermisos
    const rolesPermisosTable = await pool.request()
      .query(`
        SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'RolesPermisos'
      `);
    
    if (rolesPermisosTable.recordset[0].count === 0) {
      console.log('   ❌ La tabla RolesPermisos NO existe');
      console.log('\n   💡 Ejecuta el siguiente script SQL:');
      console.log(`
        CREATE TABLE RolesPermisos (
          RolPermisoID INT PRIMARY KEY IDENTITY(1,1),
          RolID INT NOT NULL FOREIGN KEY REFERENCES Roles(RolID) ON DELETE CASCADE,
          PermisoID INT NOT NULL FOREIGN KEY REFERENCES Permisos(PermisoID) ON DELETE CASCADE,
          UNIQUE (RolID, PermisoID)
        );
        
        CREATE INDEX idx_roles_permisos_rol ON RolesPermisos(RolID);
        CREATE INDEX idx_roles_permisos_permiso ON RolesPermisos(PermisoID);
      `);
    } else {
      console.log('   ✅ Tabla RolesPermisos encontrada');
    }
    
    // 2. Contar registros
    console.log('\n2. 📊 Contando registros:');
    try {
      const rolesCount = await pool.request()
        .query('SELECT COUNT(*) as total FROM Roles');
      console.log(`   ✅ Total de roles: ${rolesCount.recordset[0].total}`);

      const permisosCount = await pool.request()
        .query('SELECT COUNT(*) as total FROM Permisos');
      console.log(`   ✅ Total de permisos: ${permisosCount.recordset[0].total}`);

      const rolesPermisosCount = await pool.request()
        .query('SELECT COUNT(*) as total FROM RolesPermisos');
      console.log(`   ✅ Total de relaciones rol-permiso: ${rolesPermisosCount.recordset[0].total}`);
    } catch (error) {
      console.log(`   ❌ Error al contar: ${error.message}`);
    }
    
    // 3. Mostrar permisos disponibles
    console.log('\n3. 🔐 Mostrando permisos disponibles:');
    try {
      const permisosResult = await pool.request()
        .query('SELECT * FROM Permisos ORDER BY Modulo, Nombre');
      
      if (permisosResult.recordset.length > 0) {
        console.log(`   ✅ ${permisosResult.recordset.length} permiso(s) encontrado(s):`);
        
        // Agrupar por módulo
        const porModulo = permisosResult.recordset.reduce((acc, p) => {
          if (!acc[p.Modulo]) acc[p.Modulo] = [];
          acc[p.Modulo].push(p);
          return acc;
        }, {});
        
        Object.keys(porModulo).forEach(modulo => {
          console.log(`   📁 ${modulo}:`);
          porModulo[modulo].forEach(p => {
            console.log(`     - ${p.Nombre} (${p.Codigo})`);
          });
        });
      } else {
        console.log('   ℹ️ No hay permisos en la tabla');
      }
    } catch (error) {
      console.log(`   ❌ Error al obtener permisos: ${error.message}`);
    }
    
    // 4. Mostrar roles existentes
    console.log('\n4. 👥 Mostrando roles existentes:');
    try {
      const rolesResult = await pool.request()
        .query('SELECT * FROM Roles ORDER BY Nombre');
      
      if (rolesResult.recordset.length > 0) {
        console.log(`   ✅ ${rolesResult.recordset.length} rol(es) encontrado(s):`);
        rolesResult.recordset.forEach((rol, index) => {
          console.log(`   ${index + 1}. ${rol.Nombre} (${rol.Activo ? 'Activo' : 'Inactivo'})`);
          console.log(`      Descripción: ${rol.Descripcion}`);
          console.log(`      ID: ${rol.RolID}`);
        });
      } else {
        console.log('   ℹ️ No hay roles en la tabla');
      }
    } catch (error) {
      console.log(`   ❌ Error al obtener roles: ${error.message}`);
    }
    
    // 5. Verificar API endpoints
    console.log('\n5. 🌐 Endpoints de la API disponibles:');
    console.log('   Roles:');
    console.log('   - GET  http://localhost:5000/api/roles');
    console.log('   - GET  http://localhost:5000/api/roles/:id');
    console.log('   - POST http://localhost:5000/api/roles');
    console.log('   - PUT  http://localhost:5000/api/roles/:id');
    console.log('   - DELETE http://localhost:5000/api/roles/:id');
    console.log('   - PATCH http://localhost:5000/api/roles/:id/status');
    console.log('   - PUT  http://localhost:5000/api/roles/:id/permisos');
    console.log('');
    console.log('   Permisos:');
    console.log('   - GET  http://localhost:5000/api/permisos');
    console.log('   - GET  http://localhost:5000/api/permisos/modulos');
    console.log('\n   Para probar manualmente:');
    console.log('   curl -X GET http://localhost:5000/api/roles');
    console.log('   curl -X GET http://localhost:5000/api/permisos');
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.log('\n🔧 Solucionar problemas:');
    console.log('1. Verifica que SQL Server esté corriendo');
    console.log('2. Verifica las credenciales en el archivo .env');
    console.log('3. Asegúrate de que la base de datos existe');
    console.log('4. Verifica que el usuario tenga permisos');
    
    if (error.message.includes('Login failed')) {
      console.log('\n🔑 Problema de autenticación:');
      console.log('   - Verifica usuario y contraseña');
      console.log('   - Prueba con autenticación de Windows');
    }
    
    if (error.message.includes('Cannot open database')) {
      console.log('\n🗄️ Problema con la base de datos:');
      console.log('   - Verifica que la base de datos exista');
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
testRoles();
