const usuariosService = require('../services/usuarios.service');

class UsuariosController {
  async getAll(req, res, next) {
    try {
      const usuarios = await usuariosService.getAllUsuarios();
      res.json({
        success: true,
        data: usuarios,
        count: usuarios.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const usuario = await usuariosService.getUsuarioById(parseInt(id));
      res.json({
        success: true,
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const usuarioData = req.body;
      const nuevoUsuario = await usuariosService.createUsuario(usuarioData);
      res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        data: nuevoUsuario
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const usuarioData = req.body;
      const usuarioActualizado = await usuariosService.updateUsuario(parseInt(id), usuarioData);
      res.json({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: usuarioActualizado
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await usuariosService.deleteUsuario(parseInt(id));
      res.json({
        success: true,
        message: 'Usuario eliminado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const { term } = req.query;
      const usuarios = await usuariosService.searchUsuarios(term);
      res.json({
        success: true,
        data: usuarios,
        count: usuarios.length
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const usuario = await usuariosService.toggleUsuarioStatus(parseInt(id), activo);
      res.json({
        success: true,
        message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
        data: usuario
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsuariosController();