const clientesService = require('../services/clientes.service');

class ClientesController {
  // Obtener todos los clientes
  async getAll(req, res, next) {
    try {
      console.log('🟢 GET /api/clientes recibido');
      const clientes = await clientesService.getAllClientes();
      res.json({
        success: true,
        data: clientes,
        count: clientes.length
      });
    } catch (error) {
      console.error('❌ Error en GET /api/clientes:', error);
      next(error);
    }
  }

  // Obtener cliente por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      console.log('🟢 GET /api/clientes/', id);
      const cliente = await clientesService.getClienteById(parseInt(id));
      res.json({
        success: true,
        data: cliente
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo cliente
  async create(req, res, next) {
    try {
      console.log('🟢 POST /api/clientes recibido. Datos:', req.body);
      const clienteData = req.body;
      const nuevoCliente = await clientesService.createCliente(clienteData);
      res.status(201).json({
        success: true,
        message: 'Cliente creado correctamente',
        data: nuevoCliente
      });
    } catch (error) {
      console.error('❌ Error en POST /api/clientes:', error);
      next(error);
    }
  }

  // Actualizar cliente
  async update(req, res, next) {
    try {
      const { id } = req.params;
      console.log('🟢 PUT /api/clientes/', id, 'Datos:', req.body);
      const clienteData = req.body;
      const clienteActualizado = await clientesService.updateCliente(parseInt(id), clienteData);
      res.json({
        success: true,
        message: 'Cliente actualizado correctamente',
        data: clienteActualizado
      });
    } catch (error) {
      console.error('❌ Error en PUT /api/clientes:', error);
      next(error);
    }
  }

  // Eliminar cliente
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      console.log('🟢 DELETE /api/clientes/', id);
      await clientesService.deleteCliente(parseInt(id));
      res.json({
        success: true,
        message: 'Cliente eliminado correctamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar clientes
  async search(req, res, next) {
    try {
      const { term } = req.query;
      console.log('🟢 GET /api/clientes/search?term=', term);
      const clientes = await clientesService.searchClientes(term);
      res.json({
        success: true,
        data: clientes,
        count: clientes.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Cambiar estado del cliente
  async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      console.log('🟢 PATCH /api/clientes/', id, '/status. Activo:', activo);
      const cliente = await clientesService.toggleClienteStatus(parseInt(id), activo);
      res.json({
        success: true,
        message: `Cliente ${activo ? 'activado' : 'desactivado'} correctamente`,
        data: cliente
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientesController();