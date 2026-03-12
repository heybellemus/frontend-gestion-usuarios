const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');

// Obtener todos los permisos
router.get('/', rolesController.getPermisos);

// Obtener permisos agrupados por módulo
router.get('/modulos', rolesController.getPermisosByModulo);

module.exports = router;
