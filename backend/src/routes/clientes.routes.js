const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientes.controller');

// Obtener todos los clientes
router.get('/', clientesController.getAll);

// Buscar clientes
router.get('/search', clientesController.search);

// Obtener cliente por ID
router.get('/:id', clientesController.getById);

// Crear nuevo cliente
router.post('/', clientesController.create);

// Actualizar cliente
router.put('/:id', clientesController.update);

// Eliminar cliente
router.delete('/:id', clientesController.delete);

// Cambiar estado del cliente
router.patch('/:id/status', clientesController.toggleStatus);

module.exports = router;