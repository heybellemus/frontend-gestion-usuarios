const { getConnection, sql } = require('../config/database');

class Usuario {
  static async getAll() {
    try {
      const pool = await getConnection();
      const result = await pool.request().query(`
        SELECT 
          UsuarioID,
          Nombre,
          Apellido,
          Email,
          NombreUsuario,
          DepartamentoID,
          RolID,
          Activo,
          FechaCreacion,
          UltimoAcceso,
          IntentosFallidos,
          Bloqueado,
          FechaBloqueo
        FROM Usuarios
        ORDER BY FechaCreacion DESC
      `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('UsuarioID', sql.Int, id)
        .query(`
          SELECT * FROM Usuarios 
          WHERE UsuarioID = @UsuarioID
        `);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async create(usuarioData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('Nombre', sql.NVarChar, usuarioData.nombre)
        .input('Apellido', sql.NVarChar, usuarioData.apellido)
        .input('Email', sql.NVarChar, usuarioData.email)
        .input('NombreUsuario', sql.NVarChar, usuarioData.nombreUsuario)
        .input('PasswordHash', sql.NVarChar, usuarioData.passwordHash || 'password_temp')
        .input('DepartamentoID', sql.Int, usuarioData.departamentoId)
        .input('RolID', sql.Int, usuarioData.rolId)
        .input('Activo', sql.Bit, usuarioData.activo !== undefined ? usuarioData.activo : 1)
        .query(`
          INSERT INTO Usuarios 
          (Nombre, Apellido, Email, NombreUsuario, PasswordHash, DepartamentoID, RolID, Activo, FechaCreacion)
          OUTPUT INSERTED.*
          VALUES (@Nombre, @Apellido, @Email, @NombreUsuario, @PasswordHash, @DepartamentoID, @RolID, @Activo, GETDATE())
        `);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(id, usuarioData) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('UsuarioID', sql.Int, id)
        .input('Nombre', sql.NVarChar, usuarioData.nombre)
        .input('Apellido', sql.NVarChar, usuarioData.apellido)
        .input('Email', sql.NVarChar, usuarioData.email)
        .input('NombreUsuario', sql.NVarChar, usuarioData.nombreUsuario)
        .input('DepartamentoID', sql.Int, usuarioData.departamentoId)
        .input('RolID', sql.Int, usuarioData.rolId)
        .input('Activo', sql.Bit, usuarioData.activo)
        .query(`
          UPDATE Usuarios SET
            Nombre = @Nombre,
            Apellido = @Apellido,
            Email = @Email,
            NombreUsuario = @NombreUsuario,
            DepartamentoID = @DepartamentoID,
            RolID = @RolID,
            Activo = @Activo
          WHERE UsuarioID = @UsuarioID
          
          SELECT * FROM Usuarios WHERE UsuarioID = @UsuarioID
        `);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('UsuarioID', sql.Int, id)
        .query('DELETE FROM Usuarios WHERE UsuarioID = @UsuarioID');
      return result.rowsAffected[0];
    } catch (error) {
      throw error;
    }
  }

  static async search(term) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('SearchTerm', sql.NVarChar, `%${term}%`)
        .query(`
          SELECT * FROM Usuarios 
          WHERE 
            Nombre LIKE @SearchTerm OR
            Apellido LIKE @SearchTerm OR
            Email LIKE @SearchTerm OR
            NombreUsuario LIKE @SearchTerm
        `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  static async updateLastAccess(id) {
    try {
      const pool = await getConnection();
      await pool.request()
        .input('UsuarioID', sql.Int, id)
        .query('UPDATE Usuarios SET UltimoAcceso = GETDATE() WHERE UsuarioID = @UsuarioID');
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Usuario;