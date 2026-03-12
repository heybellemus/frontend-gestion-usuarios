const Cliente = require('../models/cliente.model');

class ClientesService {
  // Obtener todos los clientes
  async getAllClientes() {
    try {
      const clientes = await Cliente.getAll();
      return clientes;
    } catch (error) {
      throw new Error(`Error al obtener clientes: ${error.message}`);
    }
  }

  // Obtener cliente por ID
  async getClienteById(id) {
    try {
      const cliente = await Cliente.getById(id);
      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }
      return cliente;
    } catch (error) {
      throw new Error(`Error al obtener cliente: ${error.message}`);
    }
  }

  // Crear nuevo cliente
  async createCliente(clienteData) {
    try {
      console.log('Datos recibidos en servicio cliente:', clienteData);
      
      // Validaciones
      if (!clienteData.tipoDocumento || !clienteData.numeroDocumento) {
        throw new Error('Tipo y número de documento son requeridos');
      }

      if (!clienteData.razonSocial) {
        throw new Error('Razón social es requerida');
      }

      // Validar formato de documento según tipo
      if (clienteData.tipoDocumento === 'DNI' && clienteData.numeroDocumento.length !== 8) {
        throw new Error('El DNI debe tener 8 dígitos');
      }

      if (clienteData.tipoDocumento === 'RUC' && clienteData.numeroDocumento.length !== 11) {
        throw new Error('El RUC debe tener 11 dígitos');
      }

      // Verificar si el documento ya existe
      const documentoExiste = await Cliente.documentoExists(clienteData.numeroDocumento);
      if (documentoExiste) {
        throw new Error('Ya existe un cliente con ese número de documento');
      }

      // Validar email si se proporciona
      if (clienteData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(clienteData.email)) {
          throw new Error('Email inválido');
        }
      }

      const nuevoCliente = await Cliente.create(clienteData);
      console.log('Cliente creado:', nuevoCliente);
      return nuevoCliente;
    } catch (error) {
      console.error('Error en servicio cliente:', error);
      throw new Error(`Error al crear cliente: ${error.message}`);
    }
  }

  // Actualizar cliente
  async updateCliente(id, clienteData) {
    try {
      console.log('Actualizando cliente ID:', id, 'Datos:', clienteData);
      
      // Verificar si el cliente existe
      const clienteExistente = await Cliente.getById(id);
      if (!clienteExistente) {
        throw new Error('Cliente no encontrado');
      }

      // Validaciones
      if (!clienteData.tipoDocumento || !clienteData.numeroDocumento) {
        throw new Error('Tipo y número de documento son requeridos');
      }

      if (!clienteData.razonSocial) {
        throw new Error('Razón social es requerida');
      }

      // Validar formato de documento según tipo
      if (clienteData.tipoDocumento === 'DNI' && clienteData.numeroDocumento.length !== 8) {
        throw new Error('El DNI debe tener 8 dígitos');
      }

      if (clienteData.tipoDocumento === 'RUC' && clienteData.numeroDocumento.length !== 11) {
        throw new Error('El RUC debe tener 11 dígitos');
      }

      // Verificar si el documento ya existe en otro cliente
      const documentoExiste = await Cliente.documentoExists(clienteData.numeroDocumento, id);
      if (documentoExiste) {
        throw new Error('Ya existe otro cliente con ese número de documento');
      }

      // Validar email si se proporciona
      if (clienteData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(clienteData.email)) {
          throw new Error('Email inválido');
        }
      }

      const clienteActualizado = await Cliente.update(id, clienteData);
      if (!clienteActualizado) {
        throw new Error('Cliente no encontrado');
      }
      
      return clienteActualizado;
    } catch (error) {
      console.error('Error en servicio cliente update:', error);
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }
  }

  // Eliminar cliente
  async deleteCliente(id) {
    try {
      const resultado = await Cliente.delete(id);
      if (resultado === 0) {
        throw new Error('Cliente no encontrado');
      }
      return resultado;
    } catch (error) {
      throw new Error(`Error al eliminar cliente: ${error.message}`);
    }
  }

  // Buscar clientes
  async searchClientes(term) {
    try {
      const clientes = await Cliente.search(term);
      return clientes;
    } catch (error) {
      throw new Error(`Error al buscar clientes: ${error.message}`);
    }
  }

  // Cambiar estado del cliente
  async toggleClienteStatus(id, activo) {
    try {
      const cliente = await Cliente.getById(id);
      if (!cliente) {
        throw new Error('Cliente no encontrado');
      }

      const clienteActualizado = await Cliente.update(id, { activo });
      return clienteActualizado;
    } catch (error) {
      throw new Error(`Error al cambiar estado del cliente: ${error.message}`);
    }
  }
}

module.exports = new ClientesService();