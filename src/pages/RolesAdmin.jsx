import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Pagination,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

const API_BASE = 'http://localhost:8000/api';

const RolesAdmin = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
    nivel_acceso: 2,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Cargar roles
  const fetchRoles = async (currentPage = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/roles/?page=${currentPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.results || data);
        setTotalPages(Math.ceil(data.count / 10) || 1);
      } else {
        throw new Error(data.error || 'Error cargando roles');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(page);
  }, [page]);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      activo: true,
      nivel_acceso: 2,
    });
    setEditingRol(null);
  };

  // Abrir diálogo para crear/editar
  const handleOpenDialog = (rol = null) => {
    if (rol) {
      setEditingRol(rol);
      setFormData({
        nombre: rol.nombre,
        descripcion: rol.descripcion || '',
        activo: rol.activo,
        nivel_acceso: rol.nivel_acceso || 2,
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  // Guardar rol
  const handleSave = async () => {
    try {
      const url = editingRol 
        ? `${API_BASE}/roles/${editingRol.id}/`
        : `${API_BASE}/roles/`;
      
      const method = editingRol ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: editingRol ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente',
          severity: 'success',
        });
        handleCloseDialog();
        fetchRoles(page);
      } else {
        throw new Error(data.error || 'Error guardando rol');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error',
      });
    }
  };

  // Eliminar rol
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este rol? Esta acción no se puede deshacer.')) return;

    try {
      const response = await fetch(`${API_BASE}/roles/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Rol eliminado exitosamente',
          severity: 'success',
        });
        fetchRoles(page);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Error eliminando rol');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error',
      });
    }
  };

  // Cambiar página
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Obtener color según nivel de acceso
  const getNivelAccesoColor = (nivel) => {
    switch (nivel) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      case 4: return 'success';
      default: return 'default';
    }
  };

  // Obtener texto según nivel de acceso
  const getNivelAccesoText = (nivel) => {
    switch (nivel) {
      case 1: return 'Administrador';
      case 2: return 'Gestión';
      case 3: return 'Supervisor';
      case 4: return 'Usuario';
      default: return 'Sin definir';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Administración de Roles
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchRoles(page)}
          >
            Refrescar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Rol
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Nivel Acceso</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography>Cargando...</Typography>
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography>No hay roles registrados</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((rol) => (
                  <TableRow key={rol.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon color="primary" />
                        <Typography variant="body2" fontWeight="bold">
                          {rol.nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {rol.descripcion || 'Sin descripción'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getNivelAccesoText(rol.nivel_acceso)}
                        color={getNivelAccesoColor(rol.nivel_acceso)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rol.activo ? 'Activo' : 'Inactivo'}
                        color={rol.activo ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(rol)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(rol.id)}
                            disabled={rol.id === 1} // No permitir eliminar rol de administrador
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Diálogo Crear/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRol ? 'Editar Rol' : 'Nuevo Rol'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre del Rol"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              fullWidth
              required
              helperText="Nombre descriptivo del rol (ej: Administrador, Operador)"
            />
            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Descripción detallada de las responsabilidades del rol"
            />
            <FormControl fullWidth required>
              <InputLabel>Nivel de Acceso</InputLabel>
              <Select
                value={formData.nivel_acceso}
                onChange={(e) => setFormData({ ...formData, nivel_aceso: e.target.value })}
                label="Nivel de Acceso"
              >
                <MenuItem value={1}>Nivel 1 - Administrador</MenuItem>
                <MenuItem value={2}>Nivel 2 - Gestión</MenuItem>
                <MenuItem value={3}>Nivel 3 - Supervisor</MenuItem>
                <MenuItem value={4}>Nivel 4 - Usuario</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                />
              }
              label="Rol activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingRol ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RolesAdmin;
