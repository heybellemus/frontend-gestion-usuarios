import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  Box,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  TablePagination,
  CircularProgress,
  Backdrop,
  Avatar,
  Grid,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Straighten as UnitIcon
} from '@mui/icons-material';

const API_URL = 'http://127.0.0.1:8000/api/menu-unidades-medida/';

// Función para exportar a CSV
const exportToCSV = (data, filename) => {
  const headers = ['ID', 'Código', 'Nombre', 'Símbolo', 'Descripción', 'Estado', 'Fecha Creación'];
  const csvRows = [];
  
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = [
      row.id_unidad_medida,
      `"${row.codigo_unidad}"`,
      `"${row.nombre_unidad}"`,
      `"${row.simbolo_unidad}"`,
      `"${row.descripcion_unidad || ''}"`,
      row.activo_unidad ? 'Activo' : 'Inactivo',
      `"${formatDateStatic(row.fecha_creacion_unidad)}"`
    ];
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Función para exportar a JSON
const exportToJSON = (data, filename) => {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Función estática para formatear fecha
function formatDateStatic(dateString) {
  if (!dateString) return 'Fecha no disponible';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
}

const UnidadesMedidaCRUD = () => {
  // Estados para datos
  const [unidades, setUnidades] = useState([]);
  const [filteredUnidades, setFilteredUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    estado: 'todos',
    fechaInicio: null,
    fechaFin: null
  });
  
  // Estados para menú de exportación
  const [anchorElExport, setAnchorElExport] = useState(null);
  const openExportMenu = Boolean(anchorElExport);
  
  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    codigo_unidad: '',
    nombre_unidad: '',
    simbolo_unidad: '',
    descripcion_unidad: '',
    activo_unidad: true
  });

  // Estado para validación
  const [formErrors, setFormErrors] = useState({});

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

  // Obtener unidades de medida
  const fetchUnidades = async () => {
    setLoading(true);
    try {
      let nextUrl = API_URL;
      let allUnidades = [];
      let total = 0;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar las unidades de medida');

        const data = await response.json();
        console.log('Datos recibidos:', data);

        if (Array.isArray(data)) {
          allUnidades = data;
          total = data.length;
          break;
        }

        allUnidades = [...allUnidades, ...(data.results || [])];
        total = data.count || allUnidades.length;
        nextUrl = data.next;
      }

      setUnidades(allUnidades);
      setFilteredUnidades(allUnidades);
      setTotalCount(total || allUnidades.length);

    } catch (error) {
      console.error('Error en fetchUnidades:', error);
      showSnackbar('Error al cargar las unidades de medida', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [filters, unidades]);

  const applyFilters = () => {
    let filtered = [...unidades];

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(unidad => 
        unidad.nombre_unidad.toLowerCase().includes(searchLower) ||
        unidad.codigo_unidad.toLowerCase().includes(searchLower) ||
        unidad.simbolo_unidad.toLowerCase().includes(searchLower) ||
        (unidad.descripcion_unidad && unidad.descripcion_unidad.toLowerCase().includes(searchLower))
      );
    }

    // Filtro de estado
    if (filters.estado !== 'todos') {
      const estadoValue = filters.estado === 'activo';
      filtered = filtered.filter(unidad => unidad.activo_unidad === estadoValue);
    }

    // Filtro de fechas
    if (filters.fechaInicio) {
      filtered = filtered.filter(unidad => {
        if (!unidad.fecha_creacion_unidad) return false;
        const unidadDate = new Date(unidad.fecha_creacion_unidad).setHours(0,0,0,0);
        return unidadDate >= new Date(filters.fechaInicio).setHours(0,0,0,0);
      });
    }

    if (filters.fechaFin) {
      filtered = filtered.filter(unidad => {
        if (!unidad.fecha_creacion_unidad) return false;
        const unidadDate = new Date(unidad.fecha_creacion_unidad).setHours(0,0,0,0);
        return unidadDate <= new Date(filters.fechaFin).setHours(0,0,0,0);
      });
    }

    setFilteredUnidades(filtered);
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      estado: 'todos',
      fechaInicio: null,
      fechaFin: null
    });
  };

  // Crear nueva unidad
  const createUnidad = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const unidadData = {
        codigo_unidad: formData.codigo_unidad,
        nombre_unidad: formData.nombre_unidad,
        simbolo_unidad: formData.simbolo_unidad,
        descripcion_unidad: formData.descripcion_unidad || '',
        activo_unidad: formData.activo_unidad
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(unidadData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la unidad');
      }
      
      showSnackbar('Unidad creada exitosamente', 'success');
      handleCloseDialog();
      await fetchUnidades();
      
    } catch (error) {
      showSnackbar(error.message || 'Error al crear la unidad', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Actualizar unidad
  const updateUnidad = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const unidadData = {
        codigo_unidad: formData.codigo_unidad,
        nombre_unidad: formData.nombre_unidad,
        simbolo_unidad: formData.simbolo_unidad,
        descripcion_unidad: formData.descripcion_unidad || '',
        activo_unidad: formData.activo_unidad
      };

      const response = await fetch(`${API_URL}${selectedUnidad.id_unidad_medida}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(unidadData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la unidad');
      }
      
      showSnackbar('Unidad actualizada exitosamente', 'success');
      handleCloseDialog();
      await fetchUnidades();
      
    } catch (error) {
      showSnackbar(error.message || 'Error al actualizar la unidad', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Eliminar unidad
  const deleteUnidad = async () => {
    setLoadingAction(true);
    try {
      const response = await fetch(`${API_URL}${selectedUnidad.id_unidad_medida}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la unidad');
      }
      
      showSnackbar('Unidad eliminada exitosamente', 'success');
      setOpenDeleteDialog(false);
      await fetchUnidades();
      
    } catch (error) {
      showSnackbar('Error al eliminar la unidad', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Funciones de exportación
  const exportToCSVFile = () => {
    try {
      exportToCSV(filteredUnidades, `unidades_medida_${new Date().toISOString().split('T')[0]}`);
      showSnackbar('Archivo CSV exportado exitosamente', 'success');
      handleCloseExportMenu();
    } catch (error) {
      showSnackbar('Error al exportar a CSV', 'error');
    }
  };

  const exportToJSONFile = () => {
    try {
      exportToJSON(filteredUnidades, `unidades_medida_${new Date().toISOString().split('T')[0]}`);
      showSnackbar('Archivo JSON exportado exitosamente', 'success');
      handleCloseExportMenu();
    } catch (error) {
      showSnackbar('Error al exportar a JSON', 'error');
    }
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    if (!formData.codigo_unidad?.trim()) {
      errors.codigo_unidad = 'El código de unidad es requerido';
    }
    if (!formData.nombre_unidad?.trim()) {
      errors.nombre_unidad = 'El nombre de unidad es requerido';
    }
    if (!formData.simbolo_unidad?.trim()) {
      errors.simbolo_unidad = 'El símbolo es requerido';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Utilidades
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenCreateDialog = () => {
    setSelectedUnidad(null);
    setFormData({
      codigo_unidad: '',
      nombre_unidad: '',
      simbolo_unidad: '',
      descripcion_unidad: '',
      activo_unidad: true
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (unidad) => {
    setSelectedUnidad(unidad);
    setFormData({
      codigo_unidad: unidad.codigo_unidad,
      nombre_unidad: unidad.nombre_unidad,
      simbolo_unidad: unidad.simbolo_unidad,
      descripcion_unidad: unidad.descripcion_unidad || '',
      activo_unidad: unidad.activo_unidad
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenDeleteDialog = (unidad) => {
    setSelectedUnidad(unidad);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUnidad(null);
    setFormData({
      codigo_unidad: '',
      nombre_unidad: '',
      simbolo_unidad: '',
      descripcion_unidad: '',
      activo_unidad: true
    });
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (selectedUnidad) {
      updateUnidad();
    } else {
      createUnidad();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSwitchChange = (e) => {
    setFormData(prev => ({
      ...prev,
      activo_unidad: e.target.checked
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (field, value) => {
    if (!value) {
      handleFilterChange(field, null);
      return;
    }
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      handleFilterChange(field, date);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    clearFilters();
    fetchUnidades();
    showSnackbar('Datos actualizados', 'info');
  };

  const handleExportClick = (event) => {
    setAnchorElExport(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setAnchorElExport(null);
  };

  const formatDate = (dateString) => {
    return formatDateStatic(dateString);
  };

  const getFilteredCount = () => {
    return filteredUnidades.length;
  };

  const hasActiveFilters = () => {
    return filters.search || filters.estado !== 'todos' || filters.fechaInicio || filters.fechaFin;
  };

  // Obtener datos de la página actual
  const getCurrentPageData = () => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredUnidades.slice(start, end);
  };

  const currentPageData = getCurrentPageData();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loadingAction}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Header */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <UnitIcon />
            </Avatar>
            <Typography variant="h5" component="h1">
              Unidades de Medida
            </Typography>
            <Badge
              badgeContent={filteredUnidades.length}
              color="primary"
              showZero
              max={999}
            >
              <Chip 
                label={`Total: ${totalCount}`} 
                size="small" 
                variant="outlined"
              />
            </Badge>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Exportar datos">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleExportClick}
                disabled={filteredUnidades.length === 0}
              >
                Exportar
              </Button>
            </Tooltip>
            <Menu
              anchorEl={anchorElExport}
              open={openExportMenu}
              onClose={handleCloseExportMenu}
            >
              <MenuItem onClick={exportToCSVFile}>
                <ListItemIcon>
                  <ExcelIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText>Exportar a CSV</ListItemText>
              </MenuItem>
              <MenuItem onClick={exportToJSONFile}>
                <ListItemIcon>
                  <PdfIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Exportar a JSON</ListItemText>
              </MenuItem>
            </Menu>
            
            <Tooltip title="Refrescar datos">
              <IconButton onClick={handleRefresh} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              Nueva Unidad
            </Button>
          </Box>
        </Box>

        {/* Filtros */}
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nombre, código o descripción..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => handleFilterChange('search', '')}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.estado}
                  label="Estado"
                  onChange={(e) => handleFilterChange('estado', e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="activo">Activos</MenuItem>
                  <MenuItem value="inactivo">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha desde"
                value={filters.fechaInicio ? filters.fechaInicio.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('fechaInicio', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Fecha hasta"
                value={filters.fechaFin ? filters.fechaFin.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange('fechaFin', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Badge
                  color="secondary"
                  variant="dot"
                  invisible={!hasActiveFilters()}
                >
                  <Button
                    size="small"
                    startIcon={<FilterIcon />}
                    color="primary"
                    variant="outlined"
                  >
                    Filtros Aplicados
                  </Button>
                </Badge>
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  color="inherit"
                >
                  Limpiar Filtros
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Tabla */}
      <Paper elevation={3}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Símbolo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descripción</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Creación</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                      Cargando unidades de medida...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : currentPageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <UnitIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No hay unidades de medida disponibles
                    </Typography>
                    {hasActiveFilters() && (
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Intenta ajustar los filtros de búsqueda
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleOpenCreateDialog}
                      sx={{ mt: 2 }}
                    >
                      Crear unidad
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                currentPageData.map((unidad) => (
                  <TableRow 
                    key={unidad.id_unidad_medida}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Chip 
                        label={unidad.id_unidad_medida} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={unidad.codigo_unidad}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {unidad.nombre_unidad}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={unidad.simbolo_unidad}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {unidad.descripcion_unidad || 'Sin descripción'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={unidad.activo_unidad ? 'Activo' : 'Inactivo'}
                        color={unidad.activo_unidad ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={formatDate(unidad.fecha_creacion_unidad)}>
                        <Chip
                          label={formatDate(unidad.fecha_creacion_unidad)}
                          size="small"
                          variant="outlined"
                          icon={!unidad.fecha_creacion_unidad ? <WarningIcon /> : undefined}
                          color={!unidad.fecha_creacion_unidad ? "warning" : "default"}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Editar unidad">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEditDialog(unidad)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar unidad">
                          <IconButton
                            color="error"
                            onClick={() => handleOpenDeleteDialog(unidad)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {!loading && filteredUnidades.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredUnidades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            showFirstButton
            showLastButton
          />
        )}
      </Paper>

      {/* Diálogo para Crear/Editar */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown={loadingAction}
      >
        <DialogTitle>
          <Typography variant="h6">
            {selectedUnidad ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Código *"
                  name="codigo_unidad"
                  value={formData.codigo_unidad}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!formErrors.codigo_unidad}
                  helperText={formErrors.codigo_unidad}
                  disabled={loadingAction}
                  variant="outlined"
                  size="small"
                  placeholder="Ej: kg"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Símbolo *"
                  name="simbolo_unidad"
                  value={formData.simbolo_unidad}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!formErrors.simbolo_unidad}
                  helperText={formErrors.simbolo_unidad}
                  disabled={loadingAction}
                  variant="outlined"
                  size="small"
                  placeholder="Ej: kg"
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Nombre de la unidad *"
              name="nombre_unidad"
              value={formData.nombre_unidad}
              onChange={handleInputChange}
              fullWidth
              required
              error={!!formErrors.nombre_unidad}
              helperText={formErrors.nombre_unidad}
              disabled={loadingAction}
              variant="outlined"
              size="small"
              placeholder="Ej: Kilogramo"
            />
            
            <TextField
              label="Descripción"
              name="descripcion_unidad"
              value={formData.descripcion_unidad}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              disabled={loadingAction}
              variant="outlined"
              size="small"
              placeholder="Descripción opcional de la unidad"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.activo_unidad}
                  onChange={handleSwitchChange}
                  color="primary"
                  disabled={loadingAction}
                />
              }
              label="Unidad activa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loadingAction}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loadingAction || !formData.codigo_unidad?.trim() || !formData.nombre_unidad?.trim() || !formData.simbolo_unidad?.trim()}
            startIcon={loadingAction ? <CircularProgress size={20} /> : null}
          >
            {loadingAction ? 'Guardando...' : (selectedUnidad ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación para Eliminar */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => !loadingAction && setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" color="error">
            Confirmar Eliminación
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            ¿Estás seguro de que deseas eliminar la unidad de medida?
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={1}>
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">Código:</Typography>
                <Typography variant="body2" fontWeight="bold">{selectedUnidad?.codigo_unidad}</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="caption" color="textSecondary">Nombre:</Typography>
                <Typography variant="body2" fontWeight="bold">{selectedUnidad?.nombre_unidad}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Símbolo:</Typography>
                <Typography variant="body2">{selectedUnidad?.simbolo_unidad}</Typography>
              </Grid>
              {selectedUnidad?.descripcion_unidad && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Descripción:</Typography>
                  <Typography variant="body2">{selectedUnidad.descripcion_unidad}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={loadingAction}>
            Cancelar
          </Button>
          <Button 
            onClick={deleteUnidad} 
            variant="contained" 
            color="error"
            disabled={loadingAction}
            startIcon={loadingAction ? <CircularProgress size={20} /> : null}
          >
            {loadingAction ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
    </Container>
  );
};

export default UnidadesMedidaCRUD;