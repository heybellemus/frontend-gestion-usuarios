const { getConnection } = require('../config/database');
const sql = require('mssql');

class Departamento {
  // Obtener todos los departamentos
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT * FROM Departamentos 
          ORDER BY Nombre ASC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Obtener departamento por ID
  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Departamentos WHERE DepartamentoID = @id');
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  // Crear nuevo departamento
  static async create(departamentoData) {
    try {
      console.log('Datos recibidos en modelo:', departamentoData);
      const { nombre, descripcion, activo = true } = departamentoData;
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('nombre', sql.NVarChar, nombre)
        .input('descripcion', sql.NVarChar, descripcion)
        .input('activo', sql.Bit, activo)
        .query(`
          INSERT INTO Departamentos (Nombre, Descripcion, Activo, FechaCreacion) 
          OUTPUT INSERTED.DepartamentoID
          VALUES (@nombre, @descripcion, @activo, GETDATE())
        `);
      
      console.log('Resultado del INSERT:', result);
      
      // Retornar el departamento creado
      if (result.recordset && result.recordset.length > 0) {
        return await this.getById(result.recordset[0].DepartamentoID);
      }
      throw new Error('No se pudo crear el departamento');
    } catch (error) {
      console.error('Error en modelo:', error);
      throw error;
    }
  }

  // Actualizar departamento
  static async update(id, departamentoData) {
    try {
      const { nombre, descripcion, activo } = departamentoData;
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('nombre', sql.NVarChar, nombre)
        .input('descripcion', sql.NVarChar, descripcion)
        .input('activo', sql.Bit, activo)
        .query(`
          UPDATE Departamentos 
          SET Nombre = @nombre, Descripcion = @descripcion, Activo = @activo
          WHERE DepartamentoID = @id
        `);
      
      if (result.rowsAffected[0] === 0) {
        return null;
      }
      
      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar departamento
  static async delete(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Departamentos WHERE DepartamentoID = @id');
      return result.rowsAffected[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar departamentos
  static async search(term) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('term', sql.NVarChar, `%${term}%`)
        .query(`
          SELECT * FROM Departamentos 
          WHERE Nombre LIKE @term OR Descripcion LIKE @term
          ORDER BY Nombre ASC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Contar usuarios por departamento
  static async countUsuarios(departamentoId) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('departamentoId', sql.Int, departamentoId)
        .query('SELECT COUNT(*) as total FROM Usuarios WHERE DepartamentoID = @departamentoId');
      return result.recordset[0].total;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Departamento;