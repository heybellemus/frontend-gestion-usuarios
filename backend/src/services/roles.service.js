const Rol = require('../models/rol.model');
const Permiso = require('../models/permiso.model');

class RolesService {
  // Obtener todos los roles
  async getAllRoles() {
    try {
      const roles = await Rol.getAll();
      return roles;
    } catch (error) {
      throw new Error(`Error al obtener roles: ${error.message}`);
    }
  }

  // Obtener rol por ID
  async getRolById(id) {
    try {
      const rol = await Rol.getById(id);
      if (!rol) {
        throw new Error('Rol no encontrado');
      }
      return rol;
    } catch (error) {
      throw new Error(`Error al obtener rol: ${error.message}`);
    }
  }

  // Crear nuevo rol
  async createRol(rolData) {
    try {
      console.log('Datos recibidos en servicio rol:', rolData);
      
      // Validaciones
      if (!rolData.nombre) {
        throw new Error('El nombre del rol es requerido');
      }

      if (!rolData.descripcion) {
        throw new Error('La descripción del rol es requerida');
      }

      // Verificar si el nombre ya existe
      const nombreExiste = await Rol.nombreExists(rolData.nombre);
      if (nombreExiste) {
        throw new Error('Ya existe un rol con ese nombre');
      }

      // Validar permisos si se proporcionan
      if (rolData.permisosIds && rolData.permisosIds.length > 0) {
        // Verificar que todos los permisos existan
        for (const permisoId of rolData.permisosIds) {
          const permisoExists = await Permiso.exists(permisoId);
          if (!permisoExists) {
            throw new Error(`El permiso con ID ${permisoId} no existe`);
          }
        }
      }

      const nuevoRol = await Rol.create(rolData);
      console.log('Rol creado:', nuevoRol);
      return nuevoRol;
    } catch (error) {
      console.error('Error en servicio rol:', error);
      throw new Error(`Error al crear rol: ${error.message}`);
    }
  }

  // Actualizar rol
  async updateRol(id, rolData) {
    try {
      console.log('Actualizando rol ID:', id, 'Datos:', rolData);
      
      // Verificar si el rol existe
      const rolExistente = await Rol.getById(id);
      if (!rolExistente) {
        throw new Error('Rol no encontrado');
      }

      // Validaciones
      if (!rolData.nombre) {
        throw new Error('El nombre del rol es requerido');
      }

      if (!rolData.descripcion) {
        throw new Error('La descripción del rol es requerida');
      }

      // Verificar si el nombre ya existe en otro rol
      const nombreExiste = await Rol.nombreExists(rolData.nombre, id);
      if (nombreExiste) {
        throw new Error('Ya existe otro rol con ese nombre');
      }

      // Validar permisos si se proporcionan
      if (rolData.permisosIds && rolData.permisosIds.length > 0) {
        // Verificar que todos los permisos existan
        for (const permisoId of rolData.permisosIds) {
          const permisoExists = await Permiso.exists(permisoId);
          if (!permisoExists) {
            throw new Error(`El permiso con ID ${permisoId} no existe`);
          }
        }
      }

      const rolActualizado = await Rol.update(id, rolData);
      if (!rolActualizado) {
        throw new Error('Rol no encontrado');
      }
      
      return rolActualizado;
    } catch (error) {
      console.error('Error en servicio rol update:', error);
      throw new Error(`Error al actualizar rol: ${error.message}`);
    }
  }

  // Eliminar rol
  async deleteRol(id) {
    try {
      // Verificar si el rol existe
      const rolExistente = await Rol.getById(id);
      if (!rolExistente) {
        throw new Error('Rol no encontrado');
      }

      const resultado = await Rol.delete(id);
      if (resultado === 0) {
        throw new Error('Rol no encontrado');
      }
      return resultado;
    } catch (error) {
      throw new Error(`Error al eliminar rol: ${error.message}`);
    }
  }

  // Cambiar estado del rol
  async toggleRolStatus(id, activo) {
    try {
      const rol = await Rol.getById(id);
      if (!rol) {
        throw new Error('Rol no encontrado');
      }

      const rolActualizado = await Rol.toggleStatus(id, activo);
      return rolActualizado;
    } catch (error) {
      throw new Error(`Error al cambiar estado del rol: ${error.message}`);
    }
  }

  // Obtener todos los permisos disponibles
  async getAllPermisos() {
    try {
      const permisos = await Permiso.getAll();
      return permisos;
    } catch (error) {
      throw new Error(`Error al obtener permisos: ${error.message}`);
    }
  }

  // Obtener permisos agrupados por módulo
  async getPermisosByModulo() {
    try {
      const permisos = await Permiso.getAll();
      
      // Agrupar permisos por módulo
      const permisosPorModulo = permisos.reduce((acc, permiso) => {
        if (!acc[permiso.Modulo]) {
          acc[permiso.Modulo] = [];
        }
        acc[permiso.Modulo].push(permiso);
        return acc;
      }, {});
      
      return permisosPorModulo;
    } catch (error) {
      throw new Error(`Error al obtener permisos por módulo: ${error.message}`);
    }
  }

  // Asignar permisos a un rol
  async asignarPermisosARol(rolId, permisosIds) {
    try {
      // Verificar si el rol existe
      const rol = await Rol.getById(rolId);
      if (!rol) {
        throw new Error('Rol no encontrado');
      }

      // Validar permisos
      for (const permisoId of permisosIds) {
        const permisoExists = await Permiso.exists(permisoId);
        if (!permisoExists) {
          throw new Error(`El permiso con ID ${permisoId} no existe`);
        }
      }

      const rolActualizado = await Rol.update(rolId, { 
        ...rol, 
        permisosIds 
      });
      
      return rolActualizado;
    } catch (error) {
      throw new Error(`Error al asignar permisos al rol: ${error.message}`);
    }
  }
}

module.exports = new RolesService();
