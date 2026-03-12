const departamentosService = require('../services/departamentos.service');

class DepartamentosController {
  // Obtener todos los departamentos
  async getAll(req, res, next) {
    try {
      const departamentos = await departamentosService.getAllDepartamentos();
      res.json({
        success: true,
        data: departamentos,
        count: departamentos.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener departamento por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const departamento = await departamentosService.getDepartamentoById(parseInt(id));
      res.json({
        success: true,
        data: departamento
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo departamento
  async create(req, res, next) {
    try {
      console.log('Datos recibidos en backend:', req.body);
      const departamentoData = req.body;
      const nuevoDepartamento = await departamentosService.createDepartamento(departamentoData);
      res.status(201).json({
        success: true,
        message: 'Departamento creado correctamente',
        data: nuevoDepartamento
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar departamento
  async update(req, res, next) {
    try {
      console.log('Datos recibidos en backend:', req.body);
      const { id } = req.params;
      const departamentoData = req.body;
      const departamentoActualizado = await departamentosService.updateDepartamento(parseInt(id), departamentoData);
      res.json({
        success: true,
        message: 'Departamento actualizado correctamente',
        data: departamentoActualizado
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar departamento
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await departamentosService.deleteDepartamento(parseInt(id));
      res.json({
        success: true,
        message: 'Departamento eliminado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar departamentos
  async search(req, res, next) {
    try {
      const { term } = req.query;
      const departamentos = await departamentosService.searchDepartamentos(term);
      res.json({
        success: true,
        data: departamentos,
        count: departamentos.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Cambiar estado del departamento
  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      const departamento = await departamentosService.toggleDepartamentoStatus(parseInt(id), activo);
      res.json({
        success: true,
        message: `Departamento ${activo ? 'activado' : 'desactivado'} correctamente`,
        data: departamento
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DepartamentosController();