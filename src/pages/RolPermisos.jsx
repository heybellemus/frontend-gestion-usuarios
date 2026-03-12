import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  Chip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  Assignment as AssignmentIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

const RolPermisosCRUD = () => {
  // Estados principales
  const [rolPermisos, setRolPermisos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRol, setSelectedRol] = useState('');
  
  // Estados para gestión masiva de permisos
  const [permisosSeleccionados, setPermisosSeleccionados] = useState({});
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  
  // Estados para el diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    rolid: '',
    permisoid: '',
    otorgado: true,
  });
  
  // Estados para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // URLs de las APIs
  const API_URLS = {
    rolPermisos: 'http://127.0.0.1:8000/api/rolpermisos/',
    roles: 'http://127.0.0.1:8000/api/roles/',
    permisos: 'http://127.0.0.1:8000/api/permisos/',
  };

  // Función para obtener todos los rolpermisos
  const fetchRolPermisos = async () => {
    setLoading(true);
    try {
      let allRolPermisos = [];
      let nextUrl = API_URLS.rolPermisos;
      
      // Paginación: obtener todas las páginas
      while (nextUrl) {
        const response = await fetch(nextUrl);
        if (!response.ok) throw new Error('Error al obtener los datos');
        const data = await response.json();
        
        allRolPermisos = [...allRolPermisos, ...data.results];
        nextUrl = data.next;
      }
      
      setRolPermisos(allRolPermisos);
      
      // Inicializar el estado de selección
      const permisosPorRol = {};
      allRolPermisos.forEach(rp => {
        if (!permisosPorRol[rp.rolid]) {
          permisosPorRol[rp.rolid] = {};
        }
        permisosPorRol[rp.rolid][rp.permisoid] = rp.otorgado;
      });
      setPermisosSeleccionados(permisosPorRol);
      
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los datos',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener roles
  const fetchRoles = async () => {
    try {
      const response = await fetch(API_URLS.roles);
      if (!response.ok) throw new Error('Error al obtener roles');
      const data = await response.json();
      const rolesData = Array.isArray(data) ? data : data.results || [];
      setRoles(rolesData);
      
      // Seleccionar el primer rol por defecto
      if (rolesData.length > 0 && !selectedRol) {
        setSelectedRol(rolesData[0].rolid);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Función para obtener permisos
  const fetchPermisos = async () => {
    try {
      const response = await fetch(API_URLS.permisos);
      if (!response.ok) throw new Error('Error al obtener permisos');
      const data = await response.json();
      const permisosData = Array.isArray(data) ? data : data.results || [];
      
      // Organizar permisos por categorías si tienen
      const permisosAgrupados = permisosData.reduce((acc, permiso) => {
        const categoria = permiso.categoria || 'General';
        if (!acc[categoria]) {
          acc[categoria] = [];
        }
        acc[categoria].push(permiso);
        return acc;
      }, {});
      
      setPermisos(permisosAgrupados);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchRolPermisos();
    fetchRoles();
    fetchPermisos();
  }, []);

  // Manejar cambio de rol seleccionado
  const handleRolChange = (rolId) => {
    setSelectedRol(rolId);
    setCambiosPendientes({});
  };

  // Manejar cambio de checkbox individual
  const handleCheckboxChange = (permisoId, otorgado) => {
    const nuevoEstado = !otorgado;
    
    // Actualizar cambios pendientes
    setCambiosPendientes(prev => ({
      ...prev,
      [permisoId]: nuevoEstado
    }));
    
    // Actualizar vista inmediata
    setPermisosSeleccionados(prev => ({
      ...prev,
      [selectedRol]: {
        ...prev[selectedRol],
        [permisoId]: nuevoEstado
      }
    }));
  };

  // Guardar cambios de un permiso específico
  const guardarCambioPermiso = async (permisoId) => {
    const nuevoEstado = cambiosPendientes[permisoId];
    
    // Buscar si ya existe un rolpermiso para este rol y permiso
    const rolPermisoExistente = rolPermisos.find(
      rp => rp.rolid === selectedRol && rp.permisoid === permisoId
    );

    try {
      if (rolPermisoExistente) {
        // Actualizar existente
        const response = await fetch(`${API_URLS.rolPermisos}${rolPermisoExistente.rolpermisoid}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rolid: selectedRol,
            permisoid: permisoId,
            otorgado: nuevoEstado
          }),
        });

        if (!response.ok) throw new Error('Error al actualizar');
      } else {
        // Crear nuevo
        const response = await fetch(API_URLS.rolPermisos, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rolid: selectedRol,
            permisoid: permisoId,
            otorgado: nuevoEstado
          }),
        });

        if (!response.ok) throw new Error('Error al crear');
      }

      // Limpiar cambio pendiente
      setCambiosPendientes(prev => {
        const nuevosCambios = { ...prev };
        delete nuevosCambios[permisoId];
        return nuevosCambios;
      });

      // Recargar datos
      fetchRolPermisos();
      
      setSnackbar({
        open: true,
        message: 'Permiso actualizado correctamente',
        severity: 'success',
      });

    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar cambios',
        severity: 'error',
      });
    }
  };

  // Guardar todos los cambios pendientes
  const guardarTodosLosCambios = async () => {
    const cambios = Object.entries(cambiosPendientes);
    
    for (const [permisoId, nuevoEstado] of cambios) {
      await guardarCambioPermiso(permisoId);
    }
  };

  // Manejadores del diálogo para creación/edición manual
  const handleOpenDialog = (permisoId = null) => {
    if (permisoId && selectedRol) {
      const rolPermiso = rolPermisos.find(
        rp => rp.rolid === selectedRol && rp.permisoid === permisoId
      );
      if (rolPermiso) {
        setEditingId(rolPermiso.rolpermisoid);
        setFormData({
          rolid: rolPermiso.rolid,
          permisoid: rolPermiso.permisoid,
          otorgado: rolPermiso.otorgado,
        });
      }
    } else {
      setEditingId(null);
      setFormData({
        rolid: selectedRol || '',
        permisoid: '',
        otorgado: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  // Manejador de cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Función para crear o actualizar manualmente
  const handleSubmit = async () => {
    try {
      const url = editingId 
        ? `${API_URLS.rolPermisos}${editingId}/`
        : API_URLS.rolPermisos;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al guardar');

      setSnackbar({
        open: true,
        message: editingId 
          ? 'Permiso actualizado correctamente' 
          : 'Permiso creado correctamente',
        severity: 'success',
      });

      handleCloseDialog();
      fetchRolPermisos();
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar los datos',
        severity: 'error',
      });
    }
  };

  // Función para eliminar
  const handleDelete = async (rolPermisoId) => {
    if (!window.confirm('¿Estás seguro de eliminar este permiso?')) return;

    try {
      const response = await fetch(`${API_URLS.rolPermisos}${rolPermisoId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      setSnackbar({
        open: true,
        message: 'Permiso eliminado correctamente',
        severity: 'success',
      });

      fetchRolPermisos();
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar',
        severity: 'error',
      });
    }
  };

  // Función para obtener nombre del rol
  const getRolNombre = (rolId) => {
    const rol = roles.find(r => r.rolid === rolId);
    return rol ? rol.nombre : `Rol ${rolId}`;
  };

  // Función para obtener nombre del permiso
  const getPermisoNombre = (permisoId) => {
    // Buscar en todas las categorías
    for (const categoria in permisos) {
      const permiso = permisos[categoria].find(p => p.permisoid === permisoId);
      if (permiso) return permiso.nombre || `Permiso ${permisoId}`;
    }
    return `Permiso ${permisoId}`;
  };

  // Función para obtener descripción del permiso
  const getPermisoDescripcion = (permisoId) => {
    for (const categoria in permisos) {
      const permiso = permisos[categoria].find(p => p.permisoid === permisoId);
      if (permiso) return permiso.descripcion || '';
    }
    return '';
  };

  // Contar permisos otorgados para un rol
  const contarPermisosOtorgados = (rolId) => {
    const permisosRol = permisosSeleccionados[rolId];
    if (!permisosRol) return 0;
    return Object.values(permisosRol).filter(otorgado => otorgado).length;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Encabezado */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Gestión de Permisos por Rol
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Administración visual de permisos mediante checkboxes
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => fetchRolPermisos()}
              sx={{ mr: 2 }}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Agregar Permiso
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Panel izquierdo: Selección de roles */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Roles Disponibles
            </Typography>
            <List>
              {roles.map((rol) => (
                <ListItem
                  key={rol.rolid}
                  button
                  selected={selectedRol === rol.rolid}
                  onClick={() => handleRolChange(rol.rolid)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={rol.nombre || `Rol ${rol.rolid}`}
                    secondary={
                      <span style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                        <LockIcon sx={{ fontSize: 14, mr: 0.5 }} />
                        <Typography variant="caption" component="span">
                          {contarPermisosOtorgados(rol.rolid)} permisos otorgados
                        </Typography>
                      </span>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Panel central: Permisos con checkboxes */}
        <Grid item xs={12} md={6}>
          {loading ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Cargando permisos...</Typography>
            </Paper>
          ) : selectedRol ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item>
                    <Typography variant="h5">
                      Permisos para: {getRolNombre(selectedRol)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Selecciona los permisos que deseas otorgar
                    </Typography>
                  </Grid>
                  <Grid item>
                    {Object.keys(cambiosPendientes).length > 0 && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={guardarTodosLosCambios}
                        sx={{ mr: 1 }}
                      >
                        Guardar cambios ({Object.keys(cambiosPendientes).length})
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {Object.keys(permisos).length > 0 ? (
                Object.entries(permisos).map(([categoria, permisosCategoria]) => (
                  <Accordion key={categoria} defaultExpanded sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" sx={{ flex: 1 }}>
                        {categoria}
                      </Typography>
                      <Chip
                        label={`${permisosCategoria.length} permisos`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {permisosCategoria.map((permiso) => {
                          const isOtorgado = permisosSeleccionados[selectedRol]?.[permiso.permisoid] || false;
                          const tieneCambioPendiente = cambiosPendientes.hasOwnProperty(permiso.permisoid);
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={permiso.permisoid}>
                              <Card 
                                variant="outlined"
                                sx={{
                                  borderColor: tieneCambioPendiente ? 'warning.main' : 'divider',
                                  bgcolor: tieneCambioPendiente ? 'warning.light' : 'background.paper',
                                }}
                              >
                                <CardContent>
                                  <Grid container alignItems="center" spacing={1}>
                                    <Grid item>
                                      <Checkbox
                                        checked={isOtorgado}
                                        onChange={() => handleCheckboxChange(permiso.permisoid, isOtorgado)}
                                        color="primary"
                                        inputProps={{ 'aria-label': 'Otorgar permiso' }}
                                      />
                                    </Grid>
                                    <Grid item xs>
                                      <Typography variant="subtitle1">
                                        {permiso.nombre || `Permiso ${permiso.permisoid}`}
                                      </Typography>
                                      {permiso.descripcion && (
                                        <Typography variant="body2" color="textSecondary">
                                          {permiso.descripcion}
                                        </Typography>
                                      )}
                                    </Grid>
                                    <Grid item>
                                      {tieneCambioPendiente && (
                                        <Tooltip title="Cambio pendiente de guardar">
                                          <Chip
                                            label="Pendiente"
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                            onDelete={() => guardarCambioPermiso(permiso.permisoid)}
                                            deleteIcon={<SaveIcon />}
                                          />
                                        </Tooltip>
                                      )}
                                      {isOtorgado && !tieneCambioPendiente && (
                                        <Chip
                                          icon={<CheckCircleIcon />}
                                          label="Otorgado"
                                          size="small"
                                          color="success"
                                          variant="outlined"
                                        />
                                      )}
                                    </Grid>
                                  </Grid>
                                  
                                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Tooltip title="Editar manualmente">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenDialog(permiso.permisoid)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  No hay permisos disponibles
                </Typography>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <LockIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Selecciona un rol
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Por favor, selecciona un rol de la lista para gestionar sus permisos
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Panel derecho: Resumen y acciones */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumen
            </Typography>
            {selectedRol && permisosSeleccionados[selectedRol] ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Total de permisos disponibles:
                  </Typography>
                  <Typography variant="h4">
                    {Object.keys(permisos).reduce((total, cat) => total + permisos[cat].length, 0)}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Permisos otorgados:
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {contarPermisosOtorgados(selectedRol)}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Permisos denegados:
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {Object.keys(permisosSeleccionados[selectedRol]).length - contarPermisosOtorgados(selectedRol)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Cambios pendientes:
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {Object.keys(cambiosPendientes).length}
                  </Typography>
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Selecciona un rol para ver el resumen
              </Typography>
            )}
          </Paper>

          {/* Permisos recientemente modificados */}
          {selectedRol && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Últimos cambios
              </Typography>
              <List dense>
                {rolPermisos
                  .filter(rp => rp.rolid === selectedRol)
                  .sort((a, b) => new Date(b.fechaasignacion) - new Date(a.fechaasignacion))
                  .slice(0, 5)
                  .map((rp) => (
                    <ListItem key={rp.rolpermisoid}>
                      <ListItemIcon>
                        {rp.otorgado ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={getPermisoNombre(rp.permisoid)}
                        secondary={new Date(rp.fechaasignacion).toLocaleDateString()}
                      />
                    </ListItem>
                  ))}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Diálogo para crear/editar manualmente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Asignación de Permiso' : 'Nueva Asignación de Permiso'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Rol</InputLabel>
              <Select
                name="rolid"
                value={formData.rolid}
                onChange={handleInputChange}
                label="Rol"
                required
                disabled={!!editingId}
              >
                {roles.map((rol) => (
                  <MenuItem key={rol.rolid} value={rol.rolid}>
                    {rol.nombre || `Rol ${rol.rolid}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Permiso</InputLabel>
              <Select
                name="permisoid"
                value={formData.permisoid}
                onChange={handleInputChange}
                label="Permiso"
                required
                disabled={!!editingId}
              >
                {Object.values(permisos).flat().map((permiso) => (
                  <MenuItem key={permiso.permisoid} value={permiso.permisoid}>
                    {permiso.nombre || `Permiso ${permiso.permisoid}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  name="otorgado"
                  checked={formData.otorgado}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label="Otorgado"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          {editingId && (
            <Button 
              onClick={() => handleDelete(editingId)} 
              color="error"
              sx={{ mr: 'auto' }}
            >
              Eliminar
            </Button>
          )}
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RolPermisosCRUD;