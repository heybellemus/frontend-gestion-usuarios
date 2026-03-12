const Usuario = require('../models/usuario.model');

class UsuariosService {
  async getAllUsuarios() {
    try {
      return await Usuario.getAll();
    } catch (error) {
      throw error;
    }
  }

  async getUsuarioById(id) {
    try {
      const usuario = await Usuario.getById(id);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      return usuario;
    } catch (error) {
      throw error;
    }
  }

  async createUsuario(usuarioData) {
    try {
      // Validaciones adicionales
      if (!usuarioData.nombre || !usuarioData.email || !usuarioData.nombreUsuario) {
        throw new Error('Datos incompletos');
      }

      // Verificar si el email ya existe
      const existingUser = await this.searchUsuarios(usuarioData.email);
      if (existingUser.length > 0) {
        throw new Error('El email ya está registrado');
      }

      return await Usuario.create(usuarioData);
    } catch (error) {
      throw error;
    }
  }

  async updateUsuario(id, usuarioData) {
    try {
      const usuario = await Usuario.getById(id);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      return await Usuario.update(id, usuarioData);
    } catch (error) {
      throw error;
    }
  }

  async deleteUsuario(id) {
    try {
      const usuario = await Usuario.getById(id);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      const result = await Usuario.delete(id);
      if (result === 0) {
        throw new Error('No se pudo eliminar el usuario');
      }

      return { message: 'Usuario eliminado correctamente' };
    } catch (error) {
      throw error;
    }
  }

  async searchUsuarios(term) {
    try {
      return await Usuario.search(term);
    } catch (error) {
      throw error;
    }
  }

  async toggleUsuarioStatus(id, status) {
    try {
      const usuario = await Usuario.getById(id);
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      const result = await Usuario.update(id, { activo: status });
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UsuariosService();