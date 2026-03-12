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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Pagination,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Switch,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Shield as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

const API_BASE = 'http://localhost:8000/api';

const RolPantallasAdmin = () => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pantallas, setPantallas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [openMassiveDialog, setOpenMassiveDialog] = useState(false);
  const [editingAsignacion, setEditingAsignacion] = useState(null);
  const [selectedRol, setSelectedRol] = useState('');
  const [selectedPantallas, setSelectedPantallas] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Cargar asignaciones
  const fetchAsignaciones = async (currentPage = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/rolpantallas/?page=${currentPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setAsignaciones(data.results || data);
        setTotalPages(Math.ceil(data.count / 10) || 1);
      } else {
        throw new Error(data.error || 'Error cargando asignaciones');
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

  // Cargar roles
  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE}/roles/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setRoles(data.results || data);
      }
    } catch (error) {
      console.error('Error cargando roles:', error);
    }
  };

  // Cargar pantallas
  const fetchPantallas = async () => {
    try {
      const response = await fetch(`${API_BASE}/pantallas/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setPantallas(data.results || data);
      }
    } catch (error) {
      console.error('Error cargando pantallas:', error);
    }
  };

  useEffect(() => {
    fetchAsignaciones(page);
    fetchRoles();
    fetchPantallas();
  }, [page]);

  // Resetear formulario
  const resetForm = () => {
    setSelectedRol('');
    setSelectedPantallas([]);
    setEditingAsignacion(null);
  };

  // Abrir diálogo para crear/editar
  const handleOpenDialog = (asignacion = null) => {
    if (asignacion) {
      setEditingAsignacion(asignacion);
      setSelectedRol(asignacion.rol);
      setSelectedPantallas([asignacion.pantalla]);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  // Abrir diálogo de asignación masiva
  const handleOpenMassiveDialog = () => {
    resetForm();
    setOpenMassiveDialog(true);
  };

  // Cerrar diálogos
  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleCloseMassiveDialog = () => {
    setOpenMassiveDialog(false);
    resetForm();
  };

  // Guardar asignación
  const handleSave = async () => {
    try {
      const url = editingAsignacion 
        ? `${API_BASE}/rolpantallas/${editingAsignacion.id}/`
        : `${API_BASE}/rolpantallas/`;
      
      const method = editingAsignacion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          rol: selectedRol,
          pantalla: selectedPantallas[0],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: editingAsignacion ? 'Asignación actualizada exitosamente' : 'Asignación creada exitosamente',
          severity: 'success',
        });
        handleCloseDialog();
        fetchAsignaciones(page);
      } else {
        throw new Error(data.error || 'Error guardando asignación');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error',
      });
    }
  };

  // Guardar asignación masiva
  const handleSaveMassive = async () => {
    try {
      const asignacionesData = selectedPantallas.map(pantallaId => ({
        rol: selectedRol,
        pantalla: pantallaId,
      }));

      const response = await fetch(`${API_BASE}/rolpantallas/bulk_create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(asignacionesData),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: `Se asignaron ${data.created} pantallas al rol exitosamente`,
          severity: 'success',
        });
        handleCloseMassiveDialog();
        fetchAsignaciones(page);
      } else {
        throw new Error(data.error || 'Error en asignación masiva');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error',
      });
    }
  };

  // Eliminar asignación
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta asignación?')) return;

    try {
      const response = await fetch(`${API_BASE}/rolpantallas/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Asignación eliminada exitosamente',
          severity: 'success',
        });
        fetchAsignaciones(page);
      } else {
        throw new Error('Error eliminando asignación');
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

  // Manejar selección de pantallas
  const handlePantallaToggle = (pantallaId) => {
    setSelectedPantallas(prev => 
      prev.includes(pantallaId)
        ? prev.filter(id => id !== pantallaId)
        : [...prev, pantallaId]
    );
  };

  // Agrupar pantallas por módulo
  const pantallasByModulo = pantallas.reduce((acc, pantalla) => {
    if (!acc[pantalla.modulo]) {
      acc[pantalla.modulo] = [];
    }
    acc[pantalla.modulo].push(pantalla);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Administración de Permisos por Rol
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchAsignaciones(page)}
          >
            Refrescar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Asignación
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AssignmentIcon />}
            onClick={handleOpenMassiveDialog}
          >
            Asignación Masiva
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Rol</TableCell>
                <TableCell>Pantalla</TableCell>
                <TableCell>Módulo</TableCell>
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
              ) : asignaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography>No hay asignaciones registradas</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                asignaciones.map((asignacion) => (
                  <TableRow key={asignacion.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon color="primary" />
                        <Typography variant="body2" fontWeight="bold">
                          {asignacion.rol_nombre}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {asignacion.pantalla_nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {asignacion.pantalla_codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asignacion.pantalla_modulo}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asignacion.pantalla_activo ? 'Activa' : 'Inactiva'}
                        color={asignacion.pantalla_activo ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(asignacion)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(asignacion.id)}
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

      {/* Diálogo Crear/Editar Individual */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAsignacion ? 'Editar Asignación' : 'Nueva Asignación'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Rol</InputLabel>
              <Select
                value={selectedRol}
                onChange={(e) => setSelectedRol(e.target.value)}
                label="Rol"
              >
                {roles.map((rol) => (
                  <MenuItem key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Pantalla</InputLabel>
              <Select
                value={selectedPantallas[0] || ''}
                onChange={(e) => setSelectedPantallas([e.target.value])}
                label="Pantalla"
              >
                {pantallas.map((pantalla) => (
                  <MenuItem key={pantalla.id} value={pantalla.id}>
                    {pantalla.nombre} ({pantalla.codigo})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingAsignacion ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Asignación Masiva */}
      <Dialog open={openMassiveDialog} onClose={handleCloseMassiveDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          Asignación Masiva de Pantallas a Rol
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Seleccionar Rol</InputLabel>
              <Select
                value={selectedRol}
                onChange={(e) => setSelectedRol(e.target.value)}
                label="Seleccionar Rol"
              >
                {roles.map((rol) => (
                  <MenuItem key={rol.id} value={rol.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon color="primary" />
                      {rol.nombre}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedRol && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Seleccionar Pantallas
                  <Badge badgeContent={selectedPantallas.length} color="primary" sx={{ ml: 2 }}>
                    <Chip label="Seleccionadas" size="small" />
                  </Badge>
                </Typography>
                
                <Grid container spacing={2}>
                  {Object.entries(pantallasByModulo).map(([modulo, pantallasModulo]) => (
                    <Grid item xs={12} md={6} key={modulo}>
                      <Card variant="outlined">
                        <CardContent sx={{ pb: 1 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            {modulo}
                          </Typography>
                          <FormGroup>
                            {pantallasModulo.map((pantalla) => (
                              <FormControlLabel
                                key={pantalla.id}
                                control={
                                  <Checkbox
                                    checked={selectedPantallas.includes(pantalla.id)}
                                    onChange={() => handlePantallaToggle(pantalla.id)}
                                    size="small"
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography variant="body2">
                                      {pantalla.nombre}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {pantalla.codigo}
                                    </Typography>
                                  </Box>
                                }
                              />
                            ))}
                          </FormGroup>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMassiveDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveMassive} 
            variant="contained"
            disabled={!selectedRol || selectedPantallas.length === 0}
          >
            Asignar ({selectedPantallas.length} pantallas)
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

export default RolPantallasAdmin;
