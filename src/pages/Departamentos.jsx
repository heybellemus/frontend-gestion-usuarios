import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Grid,
  Box,
  Chip,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  alpha,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  Fade,
  Zoom
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,

  Description as DescriptionIcon,
  DateRange as DateRangeIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { Business as DepartmentIcon } from '@mui/icons-material';

// URL de la API
const API_URL = 'http://127.0.0.1:8000/api/departamentos/';

// Función para obtener headers con autenticación
const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Componente principal de Departamentos
const DepartamentosCRUD = () => {
  // Estados para los departamentos
  const [departamentos, setDepartamentos] = useState([]);
  const [filteredDepartamentos, setFilteredDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para el departamento actual (para edición/creación)
  const [departamentoActual, setDepartamentoActual] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });
  
  // Estado para el departamento a eliminar
  const [departamentoAEliminar, setDepartamentoAEliminar] = useState(null);
  
  // Estado para el departamento seleccionado para detalles
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para filtros
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('nombre'); // 'nombre', 'fechacreacion'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  
  // Estado para menú contextual
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Función para obtener departamentos
  const fetchDepartamentos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_URL, { headers: getHeaders() });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDepartamentos(data.results);
      setFilteredDepartamentos(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error al cargar departamentos: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar departamentos al montar el componente
  useEffect(() => {
    fetchDepartamentos();
  }, []);

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let result = [...departamentos];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(depto => 
        depto.nombre.toLowerCase().includes(term) ||
        depto.descripcion.toLowerCase().includes(term)
      );
    }
    
    // Aplicar filtro de estado
    if (filterActive === 'active') {
      result = result.filter(depto => depto.activo === true);
    } else if (filterActive === 'inactive') {
      result = result.filter(depto => depto.activo === false);
    }
    
    // Aplicar ordenamiento
    result.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'nombre') {
        aValue = a.nombre.toLowerCase();
        bValue = b.nombre.toLowerCase();
      } else if (sortBy === 'fechacreacion') {
        aValue = new Date(a.fechacreacion);
        bValue = new Date(b.fechacreacion);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredDepartamentos(result);
    setPage(0); // Resetear a la primera página al filtrar
  }, [departamentos, searchTerm, filterActive, sortBy, sortOrder]);

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Abrir diálogo para crear nuevo departamento
  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setDepartamentoActual({
      nombre: '',
      descripcion: '',
      activo: true
    });
    setOpenDialog(true);
  };

  // Abrir diálogo para editar departamento
  const handleOpenEditDialog = (departamento) => {
    setIsEditing(true);
    setDepartamentoActual(departamento);
    setOpenDialog(true);
  };

  // Abrir diálogo de detalles
  const handleOpenDetailsDialog = (departamento) => {
    setDepartamentoSeleccionado(departamento);
    setOpenDetailsDialog(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Cerrar diálogo de detalles
  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDepartamentoActual({
      ...departamentoActual,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Guardar departamento (crear o actualizar)
  const handleSaveDepartamento = async () => {
    // Validaciones
    if (!departamentoActual.nombre.trim()) {
      setSnackbar({
        open: true,
        message: 'El nombre del departamento es obligatorio',
        severity: 'warning'
      });
      return;
    }

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_URL}${departamentoActual.departamentoid}/` : API_URL;
      
      const response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(departamentoActual)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar lista de departamentos
      await fetchDepartamentos();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: `Departamento ${isEditing ? 'actualizado' : 'creado'} correctamente`,
        severity: 'success'
      });
      
      // Cerrar diálogo
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error al guardar departamento: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (departamento) => {
    setDepartamentoAEliminar(departamento);
    setOpenDeleteDialog(true);
  };

  // Eliminar departamento
  const handleDeleteDepartamento = async () => {
    if (!departamentoAEliminar) return;

    try {
      const response = await fetch(`${API_URL}${departamentoAEliminar.departamentoid}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar lista de departamentos
      await fetchDepartamentos();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: 'Departamento eliminado correctamente',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error al eliminar departamento: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setOpenDeleteDialog(false);
      setDepartamentoAEliminar(null);
    }
  };

  // Cerrar diálogo de eliminación
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDepartamentoAEliminar(null);
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Manejar búsqueda
  const handleSearch = () => {
    // La búsqueda se maneja en el useEffect de filtros
    setPage(0);
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('');
    setFilterActive('all');
    setSortBy('nombre');
    setSortOrder('asc');
  };

  // Cambiar estado activo/inactivo
  const handleToggleStatus = async (departamento) => {
    try {
      const updatedDepartamento = {
        ...departamento,
        activo: !departamento.activo
      };

      const response = await fetch(`${API_URL}${departamento.departamentoid}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updatedDepartamento)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar lista de departamentos
      await fetchDepartamentos();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: `Departamento ${updatedDepartamento.activo ? 'activado' : 'desactivado'} correctamente`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error al cambiar estado: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No registrado';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Manejar menú contextual
  const handleMenuOpen = (event, departamentoid) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(departamentoid);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Obtener departamento por ID
  const getDepartamentoById = (id) => {
    return departamentos.find(depto => depto.departamentoid === id);
  };

  // Estadísticas
  const stats = {
    total: departamentos.length,
    activos: departamentos.filter(depto => depto.activo === true).length,
    inactivos: departamentos.filter(depto => depto.activo === false).length
  };

  // Datos paginados
  const paginatedDepartamentos = filteredDepartamentos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Encabezado con estadísticas */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Gestión de Departamentos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra los departamentos de la organización
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          sx={{ borderRadius: 2 }}
        >
          Nuevo Departamento
        </Button>
      </Box>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={5}>
          <Card 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DepartmentIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Departamentos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={5}>
          <Card 
            sx={{ 
              bgcolor: 'success.main', 
              color: 'white',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Activos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.activos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card 
            sx={{ 
              bgcolor: 'error.main', 
              color: 'white',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CancelIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Inactivos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.inactivos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Panel de búsqueda y filtros */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Buscar departamentos"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTerm('')} size="small" edge="end">
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              placeholder="Buscar por nombre o descripción..."
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant={filterActive === 'all' ? 'contained' : 'outlined'}
                onClick={() => setFilterActive('all')}
                startIcon={<FilterIcon />}
                sx={{ borderRadius: 2 }}
              >
                Todos
              </Button>
              <Button
                fullWidth
                variant={filterActive === 'active' ? 'contained' : 'outlined'}
                onClick={() => setFilterActive('active')}
                startIcon={<CheckCircleIcon />}
                sx={{ borderRadius: 2 }}
                color="success"
              >
                Activos
              </Button>
              <Button
                fullWidth
                variant={filterActive === 'inactive' ? 'contained' : 'outlined'}
                onClick={() => setFilterActive('inactive')}
                startIcon={<CancelIcon />}
                sx={{ borderRadius: 2 }}
                color="error"
              >
                Inactivos
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setSortBy('nombre')}
                startIcon={<SortIcon />}
                sx={{ borderRadius: 2 }}
              >
                Ordenar
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                sx={{ borderRadius: 2, minWidth: 'auto' }}
              >
                {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleClearSearch}
              sx={{ borderRadius: 2 }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de departamentos */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="h6" gutterBottom>
              Error al cargar departamentos
            </Typography>
            <Typography color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchDepartamentos}
              startIcon={<RefreshIcon />}
            >
              Reintentar
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha de Creación</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDepartamentos.map((departamento) => (
                    <TableRow 
                      key={departamento.departamentoid} 
                      hover
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: alpha('#000', 0.04) 
                        },
                        opacity: departamento.activo === false ? 0.8 : 1
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          #{departamento.departamentoid}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DepartmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography fontWeight="medium">
                            {departamento.nombre}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={departamento.descripcion || 'Sin descripción'} arrow>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {departamento.descripcion || 'Sin descripción'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={departamento.activo ? <CheckCircleIcon /> : <CancelIcon />}
                          label={departamento.activo ? 'Activo' : 'Inactivo'}
                          color={departamento.activo ? 'success' : 'error'}
                          size="small"
                          variant={departamento.activo ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 'medium' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DateRangeIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatDate(departamento.fechacreacion)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              color="info"
                              onClick={() => handleOpenDetailsDialog(departamento)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Editar">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenEditDialog(departamento)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={departamento.activo ? 'Desactivar' : 'Activar'}>
                            <IconButton
                              color={departamento.activo ? 'warning' : 'success'}
                              onClick={() => handleToggleStatus(departamento)}
                              size="small"
                            >
                              {departamento.activo ? <ArchiveIcon /> : <UnarchiveIcon />}
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Más opciones">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, departamento.departamentoid)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Menú contextual */}
            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              TransitionComponent={Fade}
            >
              <MenuItem onClick={() => {
                const depto = getDepartamentoById(selectedRowId);
                if (depto) handleOpenDetailsDialog(depto);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                Ver detalles
              </MenuItem>
              <MenuItem onClick={() => {
                const depto = getDepartamentoById(selectedRowId);
                if (depto) handleOpenEditDialog(depto);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                Editar
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => {
                const depto = getDepartamentoById(selectedRowId);
                if (depto) handleConfirmDelete(depto);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography color="error">Eliminar</Typography>
              </MenuItem>
            </Menu>

            {/* Paginación */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredDepartamentos.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count} departamentos`
              }
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </>
        )}
      </Paper>

      {/* Diálogo para crear/editar departamento */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DepartmentIcon color="primary" />
            <Typography variant="h6">
              {isEditing ? 'Editar Departamento' : 'Nuevo Departamento'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                name="nombre"
                label="Nombre del Departamento *"
                value={departamentoActual.nombre}
                onChange={handleInputChange}
                size="small"
                required
                autoFocus
                helperText="Nombre único del departamento"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                name="descripcion"
                label="Descripción"
                value={departamentoActual.descripcion}
                onChange={handleInputChange}
                size="small"
                multiline
                rows={4}
                helperText="Descripción detallada del departamento (opcional)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="activo"
                    checked={departamentoActual.activo === true}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Departamento Activo"
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                Los departamentos inactivos no estarán disponibles para asignación
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="error" variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveDepartamento}
            variant="contained"
            color="primary"
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de detalles */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={handleCloseDetailsDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="info" />
            <Typography variant="h6">Detalles del Departamento</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {departamentoSeleccionado && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DepartmentIcon sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        {departamentoSeleccionado.nombre}
                      </Typography>
                      <Chip
                        label={departamentoSeleccionado.activo ? 'ACTIVO' : 'INACTIVO'}
                        color={departamentoSeleccionado.activo ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    DESCRIPCIÓN
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}
                  >
                    <Typography>
                      {departamentoSeleccionado.descripcion || 'Sin descripción disponible'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    INFORMACIÓN ADICIONAL
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon fontSize="small" color="action" />
                        <Typography variant="body2">ID:</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        #{departamentoSeleccionado.departamentoid}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateRangeIcon fontSize="small" color="action" />
                        <Typography variant="body2">Fecha Creación:</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(departamentoSeleccionado.fechacreacion)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDetailsDialog} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          {departamentoAEliminar && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DeleteIcon color="error" sx={{ mr: 2 }} />
                <Typography variant="h6">
                  ¿Eliminar departamento?
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Esta acción no se puede deshacer
              </Alert>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nombre:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {departamentoAEliminar.nombre}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID:
                    </Typography>
                    <Typography variant="body1">
                      #{departamentoAEliminar.departamentoid}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Estado:
                    </Typography>
                    <Chip
                      size="small"
                      label={departamentoAEliminar.activo ? 'Activo' : 'Inactivo'}
                      color={departamentoAEliminar.activo ? 'success' : 'error'}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteDepartamento}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Eliminar Definitivamente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

      {/* Información adicional */}
      <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 2, boxShadow: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="text.primary" gutterBottom>
              Información del Sistema
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              • Total de departamentos en sistema: {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Departamentos activos: {stats.activos} ({stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0}%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Departamentos inactivos: {stats.inactivos} ({stats.total > 0 ? Math.round((stats.inactivos / stats.total) * 100) : 0}%)
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              • Última actualización: {new Date().toLocaleString('es-ES')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Mostrando {paginatedDepartamentos.length} de {filteredDepartamentos.length} departamentos filtrados
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default DepartamentosCRUD;