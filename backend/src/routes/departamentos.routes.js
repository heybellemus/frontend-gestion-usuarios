const express = require('express');
const router = express.Router();
const departamentosController = require('../controllers/departamentos.controller');

// Obtener todos los departamentos
router.get('/', departamentosController.getAll);

// Buscar departamentos
router.get('/search', departamentosController.search);

// Obtener departamento por ID
router.get('/:id', departamentosController.getById);

// Crear nuevo departamento
router.post('/', departamentosController.create);

// Actualizar departamento
router.put('/:id', departamentosController.update);

// Eliminar departamento
router.delete('/:id', departamentosController.delete);

// Cambiar estado del departamento
router.patch('/:id/status', departamentosController.toggleStatus);

module.exports = router;