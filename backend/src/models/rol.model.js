const { getConnection } = require('../config/database');
const sql = require('mssql');

class Rol {
  // Obtener todos los roles con sus permisos
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            r.RolID,
            r.Nombre,
            r.Descripcion,
            r.Activo
          FROM Roles r
          ORDER BY r.Nombre ASC
        `);
      
      // Por ahora, devolver roles sin permisos hasta que se cree la tabla RolesPermisos
      return result.recordset.map(rol => ({
        ...rol,
        PermisosIDs: []
      }));
    } catch (error) {
      throw error;
    }
  }

  // Obtener rol por ID con sus permisos
  static async getById(id) {
    try {
      const pool = await getConnection();
      
      // Obtener datos del rol
      const rolResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Roles WHERE RolID = @id');
      
      if (rolResult.recordset.length === 0) {
        return null;
      }
      
      const rol = rolResult.recordset[0];
      
      // Por ahora, devolver rol sin permisos hasta que se cree la tabla RolesPermisos
      return {
        ...rol,
        Permisos: []
      };
    } catch (error) {
      throw error;
    }
  }

  // Crear nuevo rol
  static async create(rolData) {
    try {
      console.log('Datos recibidos en modelo rol:', rolData);
      const {
        nombre,
        descripcion,
        activo = true
      } = rolData;
      
      const pool = await getConnection();
      
      // Insertar rol (solo columnas que existen)
      const result = await pool.request()
        .input('nombre', sql.NVarChar(100), nombre)
        .input('descripcion', sql.NVarChar(500), descripcion)
        .input('activo', sql.Bit, activo)
        .query(`
          INSERT INTO Roles (
            Nombre, Descripcion, Activo
          ) 
          OUTPUT INSERTED.RolID
          VALUES (
            @nombre, @descripcion, @activo
          )
        `);
      
      const rolId = result.recordset[0].RolID;
      
      console.log('Rol creado con ID:', rolId);
      return await this.getById(rolId);
    } catch (error) {
      console.error('Error en modelo rol:', error);
      throw error;
    }
  }

  // Actualizar rol
  static async update(id, rolData) {
    try {
      console.log('Actualizando rol ID:', id, 'Datos:', rolData);
      const {
        nombre,
        descripcion,
        activo
      } = rolData;
      
      const pool = await getConnection();
      
      // Actualizar rol (sin permisos por ahora)
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('nombre', sql.NVarChar(100), nombre)
        .input('descripcion', sql.NVarChar(500), descripcion)
        .input('activo', sql.Bit, activo)
        .query(`
          UPDATE Roles 
          SET 
            Nombre = @nombre,
            Descripcion = @descripcion,
            Activo = @activo
          WHERE RolID = @id
        `);
      
      if (result.rowsAffected[0] === 0) {
        return null;
      }
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error en modelo rol update:', error);
      throw error;
    }
  }

  // Eliminar rol
  static async delete(id) {
    try {
      const pool = await getConnection();
      
      // Eliminar rol (sin permisos por ahora)
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Roles WHERE RolID = @id');
      
      return result.rowsAffected[0];
    } catch (error) {
      throw error;
    }
  }

  // Cambiar estado del rol
  static async toggleStatus(id, activo) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('activo', sql.Bit, activo)
        .query(`
          UPDATE Roles 
          SET Activo = @activo
          WHERE RolID = @id
        `);
      
      if (result.rowsAffected[0] === 0) {
        return null;
      }
      
      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Verificar si el nombre del rol ya existe
  static async nombreExists(nombre, excludeId = null) {
    try {
      const pool = await getConnection();
      let query = 'SELECT COUNT(*) as count FROM Roles WHERE Nombre = @nombre';
      
      if (excludeId) {
        query += ' AND RolID != @excludeId';
      }
      
      const request = pool.request()
        .input('nombre', sql.NVarChar(100), nombre);
      
      if (excludeId) {
        request.input('excludeId', sql.Int, excludeId);
      }
      
      const result = await request.query(query);
      return result.recordset[0].count > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Rol;
