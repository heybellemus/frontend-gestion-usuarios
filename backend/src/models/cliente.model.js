const { getConnection } = require('../config/database');
const sql = require('mssql');

class Cliente {
  // Obtener todos los clientes
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT * FROM Clientes 
          ORDER BY RazonSocial ASC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Obtener cliente por ID
  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Clientes WHERE ClienteID = @id');
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  // Crear nuevo cliente
  static async create(clienteData) {
    try {
      console.log('Datos recibidos en modelo cliente:', clienteData);
      const {
        tipoDocumento,
        numeroDocumento,
        razonSocial,
        nombreComercial,
        telefono,
        email,
        direccion,
        ciudad,
        pais,
        activo = true,
        creadoPor = 1
      } = clienteData;
      
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('tipoDocumento', sql.VarChar(50), tipoDocumento)
        .input('numeroDocumento', sql.VarChar(50), numeroDocumento)
        .input('razonSocial', sql.NVarChar(200), razonSocial)
        .input('nombreComercial', sql.NVarChar(200), nombreComercial || '')
        .input('telefono', sql.VarChar(20), telefono)
        .input('email', sql.VarChar(100), email)
        .input('direccion', sql.NVarChar(500), direccion)
        .input('ciudad', sql.VarChar(100), ciudad)
        .input('pais', sql.VarChar(100), pais)
        .input('activo', sql.Bit, activo)
        .input('creadoPor', sql.Int, creadoPor)
        .query(`
          INSERT INTO Clientes (
            TipoDocumento, NumeroDocumento, RazonSocial, NombreComercial,
            Telefono, Email, Direccion, Ciudad, Pais, Activo, CreadoPor, FechaCreacion
          ) 
          OUTPUT INSERTED.ClienteID
          VALUES (
            @tipoDocumento, @numeroDocumento, @razonSocial, @nombreComercial,
            @telefono, @email, @direccion, @ciudad, @pais, @activo, @creadoPor, GETDATE()
          )
        `);
      
      console.log('Resultado del INSERT cliente:', result);
      
      if (result.recordset && result.recordset.length > 0) {
        return await this.getById(result.recordset[0].ClienteID);
      }
      throw new Error('No se pudo crear el cliente');
    } catch (error) {
      console.error('Error en modelo cliente:', error);
      throw error;
    }
  }

  // Actualizar cliente
  static async update(id, clienteData) {
    try {
      const {
        tipoDocumento,
        numeroDocumento,
        razonSocial,
        nombreComercial,
        telefono,
        email,
        direccion,
        ciudad,
        pais,
        activo,
        modificadoPor = 1
      } = clienteData;
      
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('tipoDocumento', sql.VarChar(50), tipoDocumento)
        .input('numeroDocumento', sql.VarChar(50), numeroDocumento)
        .input('razonSocial', sql.NVarChar(200), razonSocial)
        .input('nombreComercial', sql.NVarChar(200), nombreComercial || '')
        .input('telefono', sql.VarChar(20), telefono)
        .input('email', sql.VarChar(100), email)
        .input('direccion', sql.NVarChar(500), direccion)
        .input('ciudad', sql.VarChar(100), ciudad)
        .input('pais', sql.VarChar(100), pais)
        .input('activo', sql.Bit, activo)
        .input('modificadoPor', sql.Int, modificadoPor)
        .query(`
          UPDATE Clientes 
          SET 
            TipoDocumento = @tipoDocumento,
            NumeroDocumento = @numeroDocumento,
            RazonSocial = @razonSocial,
            NombreComercial = @nombreComercial,
            Telefono = @telefono,
            Email = @email,
            Direccion = @direccion,
            Ciudad = @ciudad,
            Pais = @pais,
            Activo = @activo,
            ModificadoPor = @modificadoPor,
            FechaModificacion = GETDATE()
          WHERE ClienteID = @id
        `);
      
      if (result.rowsAffected[0] === 0) {
        return null;
      }
      
      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar cliente
  static async delete(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Clientes WHERE ClienteID = @id');
      return result.rowsAffected[0];
    } catch (error) {
      throw error;
    }
  }

  // Buscar clientes
  static async search(term) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('term', sql.NVarChar, `%${term}%`)
        .query(`
          SELECT * FROM Clientes 
          WHERE 
            RazonSocial LIKE @term OR 
            NombreComercial LIKE @term OR 
            NumeroDocumento LIKE @term OR 
            Email LIKE @term
          ORDER BY RazonSocial ASC
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // Verificar si documento ya existe
  static async documentoExists(numeroDocumento, excludeId = null) {
    try {
      const pool = await getConnection();
      let query = 'SELECT COUNT(*) as count FROM Clientes WHERE NumeroDocumento = @numeroDocumento';
      
      if (excludeId) {
        query += ' AND ClienteID != @excludeId';
      }
      
      const request = pool.request()
        .input('numeroDocumento', sql.VarChar(50), numeroDocumento);
      
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

module.exports = Cliente;