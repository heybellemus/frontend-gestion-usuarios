const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

// Obtener todos los usuarios
router.get('/', usuariosController.getAll);

// Buscar usuarios
router.get('/search', usuariosController.search);

// Obtener usuario por ID
router.get('/:id', usuariosController.getById);

// Crear nuevo usuario
router.post('/', usuariosController.create);

// Actualizar usuario
router.put('/:id', usuariosController.update);

// Eliminar usuario
router.delete('/:id', usuariosController.delete);

// Cambiar estado del usuario
router.patch('/:id/status', usuariosController.toggleStatus);

module.exports = router;