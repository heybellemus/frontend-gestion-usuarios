const rolesService = require('../services/roles.service');

class RolesController {
  // Obtener todos los roles
  async getAll(req, res, next) {
    try {
      console.log('🟢 GET /api/roles recibido');
      const roles = await rolesService.getAllRoles();
      res.json({
        success: true,
        data: roles,
        count: roles.length
      });
    } catch (error) {
      console.error('❌ Error en GET /api/roles:', error);
      next(error);
    }
  }

  // Obtener rol por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      console.log('🟢 GET /api/roles/', id);
      const rol = await rolesService.getRolById(parseInt(id));
      res.json({
        success: true,
        data: rol
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo rol
  async create(req, res, next) {
    try {
      console.log('🟢 POST /api/roles recibido. Datos:', req.body);
      const rolData = req.body;
      const nuevoRol = await rolesService.createRol(rolData);
      res.status(201).json({
        success: true,
        message: 'Rol creado correctamente',
        data: nuevoRol
      });
    } catch (error) {
      console.error('❌ Error en POST /api/roles:', error);
      next(error);
    }
  }

  // Actualizar rol
  async update(req, res, next) {
    try {
      const { id } = req.params;
      console.log('🟢 PUT /api/roles/', id, 'Datos:', req.body);
      const rolData = req.body;
      const rolActualizado = await rolesService.updateRol(parseInt(id), rolData);
      res.json({
        success: true,
        message: 'Rol actualizado correctamente',
        data: rolActualizado
      });
    } catch (error) {
      console.error('❌ Error en PUT /api/roles:', error);
      next(error);
    }
  }

  // Eliminar rol
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      console.log('🟢 DELETE /api/roles/', id);
      await rolesService.deleteRol(parseInt(id));
      res.json({
        success: true,
        message: 'Rol eliminado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Cambiar estado del rol
  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      console.log('🟢 PATCH /api/roles/', id, '/status. Activo:', activo);
      const rol = await rolesService.toggleRolStatus(parseInt(id), activo);
      res.json({
        success: true,
        message: `Rol ${activo ? 'activado' : 'desactivado'} correctamente`,
        data: rol
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los permisos disponibles
  async getPermisos(req, res, next) {
    try {
      console.log('🟢 GET /api/permisos recibido');
      const permisos = await rolesService.getAllPermisos();
      res.json({
        success: true,
        data: permisos,
        count: permisos.length
      });
    } catch (error) {
      console.error('❌ Error en GET /api/permisos:', error);
      next(error);
    }
  }

  // Obtener permisos agrupados por módulo
  async getPermisosByModulo(req, res, next) {
    try {
      console.log('🟢 GET /api/permisos/modulos recibido');
      const permisosPorModulo = await rolesService.getPermisosByModulo();
      res.json({
        success: true,
        data: permisosPorModulo
      });
    } catch (error) {
      console.error('❌ Error en GET /api/permisos/modulos:', error);
      next(error);
    }
  }

  // Asignar permisos a un rol
  async asignarPermisos(req, res, next) {
    try {
      const { id } = req.params;
      const { permisosIds } = req.body;
      console.log('🟢 PUT /api/roles/', id, '/permisos. Permisos:', permisosIds);
      
      const rolActualizado = await rolesService.asignarPermisosARol(parseInt(id), permisosIds);
      res.json({
        success: true,
        message: 'Permisos asignados correctamente',
        data: rolActualizado
      });
    } catch (error) {
      console.error('❌ Error en PUT /api/roles/:id/permisos:', error);
      next(error);
    }
  }
}

module.exports = new RolesController();
