const { getConnection } = require('../config/database');
const sql = require('mssql');

class Permiso {
  // Obtener todos los permisos
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT * FROM Permisos 
          ORDER BY Modulo ASC, Nombre ASC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Obtener permiso por ID
  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Permisos WHERE PermisoID = @id');
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener permisos por módulo
  static async getByModulo(modulo) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('modulo', sql.NVarChar, modulo)
        .query('SELECT * FROM Permisos WHERE Modulo = @modulo ORDER BY Nombre ASC');
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Obtener permisos por IDs
  static async getByIds(ids) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT * FROM Permisos 
          WHERE PermisoID IN (${ids.join(',')})
          ORDER BY Modulo ASC, Nombre ASC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Obtener permisos de un rol específico
  static async getByRolId(rolId) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('rolId', sql.Int, rolId)
        .query(`
          SELECT p.* 
          FROM Permisos p
          INNER JOIN RolesPermisos rp ON p.PermisoID = rp.PermisoID
          WHERE rp.RolID = @rolId
          ORDER BY p.Modulo ASC, p.Nombre ASC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Verificar si un permiso existe
  static async exists(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT COUNT(*) as count FROM Permisos WHERE PermisoID = @id');
      return result.recordset[0].count > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Permiso;
