const Departamento = require('../models/departamento.model');

class DepartamentosService {
  // Obtener todos los departamentos
  async getAllDepartamentos() {
    try {
      const departamentos = await Departamento.getAll();
      return departamentos;
    } catch (error) {
      throw new Error(`Error al obtener departamentos: ${error.message}`);
    }
  }

  // Obtener departamento por ID
  async getDepartamentoById(id) {
    try {
      const departamento = await Departamento.getById(id);
      if (!departamento) {
        throw new Error('Departamento no encontrado');
      }
      return departamento;
    } catch (error) {
      throw new Error(`Error al obtener departamento: ${error.message}`);
    }
  }

  // Crear nuevo departamento
  async createDepartamento(departamentoData) {
    try {
      console.log('Datos recibidos en servicio:', departamentoData);
      const nuevoDepartamento = await Departamento.create(departamentoData);
      console.log('Departamento creado:', nuevoDepartamento);
      return nuevoDepartamento;
    } catch (error) {
      console.error('Error en servicio:', error);
      throw new Error(`Error al crear departamento: ${error.message}`);
    }
  }

  // Actualizar departamento
  async updateDepartamento(id, departamentoData) {
    try {
      const departamentoActualizado = await Departamento.update(id, departamentoData);
      if (!departamentoActualizado) {
        throw new Error('Departamento no encontrado');
      }
      return departamentoActualizado;
    } catch (error) {
      throw new Error(`Error al actualizar departamento: ${error.message}`);
    }
  }

  // Eliminar departamento
  async deleteDepartamento(id) {
    try {
      const resultado = await Departamento.delete(id);
      if (resultado === 0) {
        throw new Error('Departamento no encontrado');
      }
      return resultado;
    } catch (error) {
      throw new Error(`Error al eliminar departamento: ${error.message}`);
    }
  }

  // Buscar departamentos
  async searchDepartamentos(term) {
    try {
      const departamentos = await Departamento.search(term);
      return departamentos;
    } catch (error) {
      throw new Error(`Error al buscar departamentos: ${error.message}`);
    }
  }

  // Cambiar estado del departamento
  async toggleDepartamentoStatus(id, activo) {
    try {
      const departamento = await Departamento.getById(id);
      if (!departamento) {
        throw new Error('Departamento no encontrado');
      }

      const departamentoActualizado = await Departamento.update(id, { activo });
      return departamentoActualizado;
    } catch (error) {
      throw new Error(`Error al cambiar estado del departamento: ${error.message}`);
    }
  }
}

module.exports = new DepartamentosService();
