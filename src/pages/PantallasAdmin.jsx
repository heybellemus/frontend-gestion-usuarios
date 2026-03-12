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
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const API_BASE = 'http://localhost:8000/api';

const PantallasAdmin = () => {
  const [pantallas, setPantallas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPantalla, setEditingPantalla] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    modulo: '',
    ruta: '',
    descripcion: '',
    activo: true,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Función para obtener el ID correcto (maneja diferentes estructuras)
  const getPantallaId = (pantalla) => {
    return pantalla?.id || pantalla?.ID || pantalla?.pantalla_id || pantalla?.pantallaid || pantalla?.codigo;
  };

  // Cargar pantallas
  const fetchPantallas = async (currentPage = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/pantallas?page=${currentPage}`, {
        headers
      });
      const data = await response.json();
      
      if (response.ok) {
        let pantallasData = [];
        let total = 0;

        if (Array.isArray(data)) {
          pantallasData = data;
          total = data.length;
        } else if (data.results) {
          pantallasData = data.results;
          total = data.count;
        } else if (data.data) {
          pantallasData = data.data;
          total = data.total || data.data.length;
        } else {
          pantallasData = data;
          total = data.length || 0;
        }

        // Asegurar que cada pantalla tenga un ID
        pantallasData = pantallasData.map(p => ({
          ...p,
          id: getPantallaId(p) || `${p.codigo}-${Date.now()}`
        }));

        setPantallas(pantallasData);
        setTotalItems(total);
        setTotalPages(Math.ceil(total / 10) || 1);
        
        console.log('Pantallas cargadas:', pantallasData);
      } else {
        throw new Error(data.error || data.detail || 'Error cargando pantallas');
      }
    } catch (error) {
      console.error('Error fetching:', error);
      setSnackbar({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPantallas(page);
  }, [page]);

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      modulo: '',
      ruta: '',
      descripcion: '',
      activo: true,
    });
    setEditingPantalla(null);
  };

  // Abrir diálogo para crear/editar
  const handleOpenDialog = (pantalla = null) => {
    console.log('Pantalla seleccionada:', pantalla);
    
    if (pantalla) {
      const pantallaId = getPantallaId(pantalla);
      console.log('ID encontrado:', pantallaId);
      
      setEditingPantalla({
        ...pantalla,
        id: pantallaId
      });
      
      setFormData({
        codigo: pantalla.codigo || '',
        nombre: pantalla.nombre || '',
        modulo: pantalla.modulo || '',
        ruta: pantalla.ruta || '',
        descripcion: pantalla.descripcion || '',
        activo: pantalla.activo !== undefined ? pantalla.activo : true,
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const validateForm = () => {
    if (!formData.codigo.trim()) {
      showMessage('El código es obligatorio', 'warning');
      return false;
    }
    if (!formData.nombre.trim()) {
      showMessage('El nombre es obligatorio', 'warning');
      return false;
    }
    if (!formData.modulo) {
      showMessage('El módulo es obligatorio', 'warning');
      return false;
    }
    return true;
  };

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Guardar pantalla - CORREGIDO con slash al final para PUT
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editingPantalla) {
        const pantallaId = getPantallaId(editingPantalla);
        if (!pantallaId) {
          showMessage('Error: ID de pantalla no encontrado', 'error');
          console.error('No ID found for editing:', editingPantalla);
          return;
        }
        setEditingPantalla(prev => ({ ...prev, id: pantallaId }));
      }

      // IMPORTANTE: Agregar slash al final para PUT
      const url = editingPantalla 
        ? `${API_BASE}/pantallas/${editingPantalla.id}/`  // <-- SLASH AL FINAL para PUT
        : `${API_BASE}/pantallas/`;  // POST ya tiene slash
      
      const method = editingPantalla ? 'PUT' : 'POST';
      
      const payload = {
        codigo: formData.codigo,
        nombre: formData.nombre,
        modulo: formData.modulo,
        ...(formData.ruta && { ruta: formData.ruta }),
        ...(formData.descripcion && { descripcion: formData.descripcion }),
        activo: formData.activo,
      };

      console.log('Guardando con URL:', { url, method, payload });

      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        console.warn('Respuesta no JSON:', data);
      }

      console.log('Respuesta:', response.status, data);

      if (response.ok) {
        showMessage(
          editingPantalla ? 'Pantalla actualizada exitosamente' : 'Pantalla creada exitosamente',
          'success'
        );
        handleCloseDialog();
        fetchPantallas(page);
      } else {
        throw new Error(
          typeof data === 'string' ? data : (data.error || data.detail || 'Error guardando pantalla')
        );
      }
    } catch (error) {
      console.error('Error en handleSave:', error);
      showMessage(error.message, 'error');
    }
  };

  // Eliminar pantalla - CORREGIDO con slash al final para DELETE
  const handleDelete = async (pantalla) => {
    const pantallaId = getPantallaId(pantalla);
    
    if (!pantallaId) {
      showMessage('Error: ID de pantalla no válido', 'error');
      console.error('ID no válido para eliminar:', pantalla);
      return;
    }

    if (!window.confirm(`¿Está seguro de eliminar la pantalla "${pantalla.nombre || pantalla.codigo}"?`)) {
      return;
    }

    try {
      // IMPORTANTE: Agregar slash al final para DELETE
      const url = `${API_BASE}/pantallas/${pantallaId}/`;  // <-- SLASH AL FINAL para DELETE
      console.log('Eliminando con URL:', url);

      const token = localStorage.getItem('authToken');
      const headers = {
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      console.log('Respuesta delete:', response.status);

      if (response.status === 204 || response.ok) {
        showMessage('Pantalla eliminada exitosamente', 'success');
        
        if (pantallas.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchPantallas(page);
        }
      } else {
        let errorMsg = 'Error eliminando pantalla';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.detail || errorMsg;
        } catch {
          // Ignorar error al parsear
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error en handleDelete:', error);
      showMessage(error.message, 'error');
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const modules = [
    'Principal',
    'Gestión',
    'Administración',
    'Reportes',
    'Configuración',
    'Seguridad',
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Administración de Pantallas {totalItems > 0 && `(${totalItems})`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchPantallas(page)}
            disabled={loading}
          >
            Refrescar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Pantalla
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Módulo</TableCell>
                <TableCell>Ruta</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                    <Typography sx={{ mt: 1 }}>Cargando pantallas...</Typography>
                  </TableCell>
                </TableRow>
              ) : pantallas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No hay pantallas registradas
                    </Typography>
                    <Button
                      variant="text"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                      sx={{ mt: 1 }}
                    >
                      Crear primera pantalla
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                pantallas.map((pantalla) => (
                  <TableRow key={pantalla.id} hover>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {pantalla.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {pantalla.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>{pantalla.nombre}</TableCell>
                    <TableCell>
                      <Chip
                        label={pantalla.modulo}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {pantalla.ruta || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pantalla.activo ? 'Activo' : 'Inactivo'}
                        color={pantalla.activo ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(pantalla)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(pantalla)}
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
              disabled={loading}
            />
          </Box>
        )}
      </Paper>

      {/* Diálogo Crear/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPantalla ? 'Editar Pantalla' : 'Nueva Pantalla'}
          {editingPantalla && (
            <Typography variant="caption" display="block" color="text.secondary">
              ID: {editingPantalla.id}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Código"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              fullWidth
              required
              helperText="Identificador único de la pantalla"
            />
            <TextField
              label="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              fullWidth
              required
              helperText="Nombre descriptivo de la pantalla"
            />
            <FormControl fullWidth required>
              <InputLabel>Módulo</InputLabel>
              <Select
                value={formData.modulo}
                onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                label="Módulo"
              >
                {modules.map((module) => (
                  <MenuItem key={module} value={module}>
                    {module}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ruta"
              value={formData.ruta}
              onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
              fullWidth
              helperText="URL de la pantalla (ej: /dashboard)"
            />
            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Descripción opcional de la pantalla"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                />
              }
              label="Pantalla activa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={loading}
          >
            {editingPantalla ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PantallasAdmin;