const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');

// Obtener todos los roles
router.get('/', rolesController.getAll);

// Obtener rol por ID
router.get('/:id', rolesController.getById);

// Crear nuevo rol
router.post('/', rolesController.create);

// Actualizar rol
router.put('/:id', rolesController.update);

// Eliminar rol
router.delete('/:id', rolesController.delete);

// Cambiar estado del rol
router.patch('/:id/status', rolesController.toggleStatus);

// Asignar permisos a un rol
router.put('/:id/permisos', rolesController.asignarPermisos);

module.exports = router;
