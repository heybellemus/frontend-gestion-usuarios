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
  Zoom,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Stack
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
  // Iconos para permisos
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  VerifiedUser as VerifiedUserIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  EditNote as EditNoteIcon,
  Create as CreateIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  FileDownload as FileDownloadIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Category as CategoryIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Apps as AppsIcon,
  FilterAlt as FilterAltIcon,
  Sort as SortIcon,
  TableChart as TableChartIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';

// URL de la API
const API_URL = 'http://127.0.0.1:8000/api/permisos/';

// Módulos predefinidos para sugerencias
const MODULOS_PREDEFINIDOS = [
  'Usuarios',
  'Clientes',
  'Dashboard',
  'Reportes',
  'Roles',
  'Departamentos',
  'Configuración',
  'Auditoría',
  'Facturación',
  'Inventario',
  'Compras',
  'Ventas',
  'Contabilidad',
  'Recursos Humanos'
];

// Componente principal de Permisos
const PermisosCRUD = () => {
  // Estados para los permisos
  const [permisos, setPermisos] = useState([]);
  const [filteredPermisos, setFilteredPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para paginación de API
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para el permiso actual (para edición/creación)
  const [permisoActual, setPermisoActual] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    modulo: ''
  });
  
  // Estados para acciones especiales
  const [permisoAEliminar, setPermisoAEliminar] = useState(null);
  const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModulo, setFilterModulo] = useState('all');
  const [sortBy, setSortBy] = useState('modulo');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Estado para tabs de vista
  const [tabValue, setTabValue] = useState(0);
  
  // Estado para menú contextual
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Función para obtener TODOS los permisos
  const fetchAllPermisos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let allPermisos = [];
      let nextPage = API_URL;
      let page = 1;
      
      // Recorrer todas las páginas
      while (nextPage) {
        const response = await fetch(nextPage);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        
        allPermisos = [...allPermisos, ...data.results];
        nextPage = data.next;
        page++;
        
        // Pequeña pausa para no sobrecargar el servidor
        if (nextPage) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setPermisos(allPermisos);
      setFilteredPermisos(allPermisos);
      setTotalCount(allPermisos.length);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error al cargar permisos: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener permisos con paginación
  const fetchPermisos = async (page = 1, size = pageSize) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = new URL(API_URL);
      url.searchParams.append('page', page);
      url.searchParams.append('page_size', size);
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      setPermisos(data.results);
      setFilteredPermisos(data.results);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / size));
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error al cargar permisos: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAllPermisos();
  }, []);

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let result = [...permisos];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(permiso => 
        permiso.nombre.toLowerCase().includes(term) ||
        permiso.codigo.toLowerCase().includes(term) ||
        permiso.descripcion.toLowerCase().includes(term) ||
        permiso.modulo.toLowerCase().includes(term)
      );
    }
    
    // Aplicar filtro de módulo
    if (filterModulo !== 'all') {
      result = result.filter(permiso => permiso.modulo === filterModulo);
    }
    
    // Aplicar ordenamiento
    result.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'nombre') {
        aValue = a.nombre.toLowerCase();
        bValue = b.nombre.toLowerCase();
      } else if (sortBy === 'codigo') {
        aValue = a.codigo.toLowerCase();
        bValue = b.codigo.toLowerCase();
      } else if (sortBy === 'modulo') {
        aValue = a.modulo.toLowerCase();
        bValue = b.modulo.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredPermisos(result);
    setPage(0);
  }, [permisos, searchTerm, filterModulo, sortBy, sortOrder]);

  // Paginación del lado del cliente para la vista actual
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Abrir diálogo para crear nuevo permiso
  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setPermisoActual({
      nombre: '',
      codigo: '',
      descripcion: '',
      modulo: ''
    });
    setOpenDialog(true);
  };

  // Abrir diálogo para editar permiso
  const handleOpenEditDialog = (permiso) => {
    setIsEditing(true);
    setPermisoActual(permiso);
    setOpenDialog(true);
  };

  // Abrir diálogo de detalles
  const handleOpenDetailsDialog = (permiso) => {
    setPermisoSeleccionado(permiso);
    setOpenDetailsDialog(true);
  };

  // Cerrar diálogos
  const handleCloseDialog = () => setOpenDialog(false);
  const handleCloseDetailsDialog = () => setOpenDetailsDialog(false);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPermisoActual({
      ...permisoActual,
      [name]: value
    });
  };

  // Manejar cambio de módulo con autocomplete
  const handleModuloChange = (event, newValue) => {
    setPermisoActual({
      ...permisoActual,
      modulo: newValue || ''
    });
  };

  // Generar código automáticamente desde el nombre
  const generarCodigoDesdeNombre = (nombre) => {
    if (!nombre) return '';
    
    // Convertir a mayúsculas, reemplazar espacios y caracteres especiales
    return nombre
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
  };

  // Actualizar código cuando cambia el nombre
  const handleNombreChange = (e) => {
    const nombre = e.target.value;
    setPermisoActual({
      ...permisoActual,
      nombre: nombre,
      codigo: generarCodigoDesdeNombre(nombre)
    });
  };

  // Validar formulario
  const validateForm = () => {
    if (!permisoActual.nombre.trim()) {
      setSnackbar({
        open: true,
        message: 'El nombre del permiso es obligatorio',
        severity: 'warning'
      });
      return false;
    }
    
    if (!permisoActual.codigo.trim()) {
      setSnackbar({
        open: true,
        message: 'El código del permiso es obligatorio',
        severity: 'warning'
      });
      return false;
    }
    
    // Validar formato del código (debe ser en mayúsculas con guiones bajos)
    const codigoRegex = /^[A-Z0-9_]+$/;
    if (!codigoRegex.test(permisoActual.codigo)) {
      setSnackbar({
        open: true,
        message: 'El código debe contener solo letras mayúsculas, números y guiones bajos',
        severity: 'warning'
      });
      return false;
    }
    
    if (!permisoActual.modulo.trim()) {
      setSnackbar({
        open: true,
        message: 'El módulo es obligatorio',
        severity: 'warning'
      });
      return false;
    }
    
    return true;
  };

  // Guardar permiso (crear o actualizar)
  const handleSavePermiso = async () => {
    if (!validateForm()) return;

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_URL}${permisoActual.permisoid}/` : API_URL;
      
      const permisoData = {
        ...permisoActual
      };
      
      console.log('Enviando datos:', permisoData);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permisoData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error respuesta:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Recargar todos los permisos
      await fetchAllPermisos();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: `Permiso ${isEditing ? 'actualizado' : 'creado'} correctamente`,
        severity: 'success'
      });
      
      // Cerrar diálogo
      handleCloseDialog();
    } catch (err) {
      console.error('Error completo:', err);
      setSnackbar({
        open: true,
        message: `Error al guardar permiso: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (permiso) => {
    setPermisoAEliminar(permiso);
    setOpenDeleteDialog(true);
  };

  // Eliminar permiso
  const handleDeletePermiso = async () => {
    if (!permisoAEliminar) return;

    try {
      const response = await fetch(`${API_URL}${permisoAEliminar.permisoid}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Recargar todos los permisos
      await fetchAllPermisos();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: 'Permiso eliminado correctamente',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error al eliminar permiso: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setOpenDeleteDialog(false);
      setPermisoAEliminar(null);
    }
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Limpiar búsqueda y filtros
  const handleClearSearch = () => {
    setSearchTerm('');
    setFilterModulo('all');
    setSortBy('modulo');
    setSortOrder('asc');
  };

  // Obtener icono según el módulo
  const getModuloIcon = (modulo) => {
    switch(modulo.toLowerCase()) {
      case 'usuarios':
        return <PeopleIcon />;
      case 'clientes':
        return <PersonIcon />;
      case 'dashboard':
        return <DashboardIcon />;
      case 'reportes':
        return <AssessmentIcon />;
      case 'roles':
        return <VerifiedUserIcon />;
      case 'departamentos':
        return <BusinessIcon />;
      case 'configuración':
        return <AdminIcon />;
      default:
        return <AppsIcon />;
    }
  };

  // Obtener color según el módulo
  const getModuloColor = (modulo) => {
    switch(modulo.toLowerCase()) {
      case 'usuarios':
        return 'primary';
      case 'clientes':
        return 'success';
      case 'dashboard':
        return 'info';
      case 'reportes':
        return 'warning';
      case 'roles':
        return 'secondary';
      case 'departamentos':
        return 'error';
      case 'configuración':
        return 'info';
      default:
        return 'default';
    }
  };

  // Obtener icono según el tipo de permiso
  const getPermisoIcon = (codigo) => {
    if (codigo.includes('VER')) return <VisibilityIcon />;
    if (codigo.includes('CREAR')) return <CreateIcon />;
    if (codigo.includes('EDITAR')) return <EditNoteIcon />;
    if (codigo.includes('EXPORTAR')) return <FileDownloadIcon />;
    if (codigo.includes('GENERAR')) return <AssessmentIcon />;
    return <SecurityIcon />;
  };

  // Obtener color según el tipo de permiso
  const getPermisoColor = (codigo) => {
    if (codigo.includes('VER')) return 'info';
    if (codigo.includes('CREAR')) return 'success';
    if (codigo.includes('EDITAR')) return 'warning';
    if (codigo.includes('ELIMINAR')) return 'error';
    if (codigo.includes('EXPORTAR')) return 'secondary';
    return 'default';
  };

  // Agrupar permisos por módulo
  const permisosPorModulo = filteredPermisos.reduce((acc, permiso) => {
    const modulo = permiso.modulo || 'Sin Módulo';
    if (!acc[modulo]) {
      acc[modulo] = [];
    }
    acc[modulo].push(permiso);
    return acc;
  }, {});

  // Estadísticas
  const stats = {
    total: permisos.length,
    modulosUnicos: Object.keys(permisosPorModulo).length,
    permisosPorModulo: Object.entries(permisosPorModulo).map(([modulo, permisos]) => ({
      modulo,
      cantidad: permisos.length
    }))
  };

  // Datos paginados
  const paginatedPermisos = filteredPermisos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Obtener todos los módulos únicos para el filtro
  const modulosUnicos = [...new Set(permisos.map(p => p.modulo))].filter(Boolean).sort();

  // Vista de acordeón por módulos
  const renderAccordionView = () => (
    <Box sx={{ mt: 2 }}>
      {Object.entries(permisosPorModulo).map(([modulo, permisosDelModulo]) => {
        const moduloIcon = getModuloIcon(modulo);
        const moduloColor = getModuloColor(modulo);
        
        return (
          <Accordion key={modulo} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Avatar sx={{ bgcolor: `${moduloColor}.light`, color: `${moduloColor}.main`, mr: 2 }}>
                  {moduloIcon}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">{modulo}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {permisosDelModulo.length} permiso{permisosDelModulo.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Chip 
                  label={`${permisosDelModulo.length}`} 
                  color={moduloColor} 
                  size="small" 
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {permisosDelModulo.map((permiso) => (
                  <Grid item xs={12} sm={6} md={4} key={permiso.permisoid}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar sx={{ bgcolor: `${getPermisoColor(permiso.codigo)}.light`, color: `${getPermisoColor(permiso.codigo)}.main`, mr: 2 }}>
                            {getPermisoIcon(permiso.codigo)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {permiso.nombre}
                            </Typography>
                            <Chip 
                              label={permiso.codigo} 
                              size="small" 
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {permiso.descripcion}
                        </Typography>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            ID: #{permiso.permisoid}
                          </Typography>
                          
                          <Box>
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenDetailsDialog(permiso)}
                              >
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditDialog(permiso)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleConfirmDelete(permiso)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );

  // Vista de tabla
  const renderTableView = () => (
    <TableContainer sx={{ maxHeight: 500 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Permiso</TableCell>
            <TableCell>Código</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell>Módulo</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedPermisos.map((permiso) => (
            <TableRow 
              key={permiso.permisoid} 
              hover
              sx={{ 
                '&:hover': { 
                  backgroundColor: alpha('#000', 0.04) 
                }
              }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: `${getPermisoColor(permiso.codigo)}.light`,
                      color: `${getPermisoColor(permiso.codigo)}.main`,
                      mr: 2
                    }}
                  >
                    {getPermisoIcon(permiso.codigo)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight="medium">
                      {permiso.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: #{permiso.permisoid}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={permiso.codigo}
                  size="small"
                  variant="outlined"
                  color={getPermisoColor(permiso.codigo)}
                  sx={{ fontFamily: 'monospace' }}
                />
              </TableCell>
              <TableCell>
                <Tooltip title={permiso.descripcion} arrow>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {permiso.descripcion}
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: `${getModuloColor(permiso.modulo)}.light`,
                      color: `${getModuloColor(permiso.modulo)}.main`,
                      mr: 1
                    }}
                  >
                    {getModuloIcon(permiso.modulo)}
                  </Avatar>
                  <Chip
                    label={permiso.modulo}
                    size="small"
                    color={getModuloColor(permiso.modulo)}
                    variant="outlined"
                  />
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Tooltip title="Ver detalles">
                    <IconButton
                      color="info"
                      onClick={() => handleOpenDetailsDialog(permiso)}
                      size="small"
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Editar">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenEditDialog(permiso)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Eliminar">
                    <IconButton
                      color="error"
                      onClick={() => handleConfirmDelete(permiso)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Gestión de Permisos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra los permisos del sistema ({permisos.length} permisos cargados)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAllPermisos}
            sx={{ borderRadius: 2 }}
          >
            Recargar Todos
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{ borderRadius: 2 }}
          >
            Nuevo Permiso
          </Button>
        </Box>
      </Box>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Permisos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AppsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Módulos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.modulosUnicos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VerifiedIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Permisos por Módulo</Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Promedio: {stats.total > 0 ? Math.round(stats.total / stats.modulosUnicos) : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Panel de búsqueda y filtros */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label="Buscar permisos"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              placeholder="Buscar por nombre, código, descripción o módulo..."
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtrar por Módulo</InputLabel>
              <Select
                value={filterModulo}
                label="Filtrar por Módulo"
                onChange={(e) => setFilterModulo(e.target.value)}
              >
                <MenuItem value="all">Todos los módulos</MenuItem>
                {modulosUnicos.map((modulo) => (
                  <MenuItem key={modulo} value={modulo}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getModuloIcon(modulo)}
                      {modulo}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                fullWidth
                variant={sortBy === 'modulo' ? 'contained' : 'outlined'}
                onClick={() => setSortBy('modulo')}
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
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleClearSearch}
                sx={{ borderRadius: 2 }}
              >
                Limpiar Filtros
              </Button>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={sortBy === 'nombre' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('nombre')}
                  size="small"
                >
                  Ordenar por Nombre
                </Button>
                <Button
                  variant={sortBy === 'codigo' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('codigo')}
                  size="small"
                >
                  Ordenar por Código
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs de vista */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontWeight: 'medium',
              py: 2
            }
          }}
        >
          <Tab 
            icon={<ViewModuleIcon />} 
            label="Vista por Módulos" 
            iconPosition="start"
          />
          <Tab 
            icon={<TableChartIcon />} 
            label="Vista de Tabla" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Contenido principal */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: 2, p: tabValue === 0 ? 0 : 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="h6" gutterBottom>
              Error al cargar permisos
            </Typography>
            <Typography color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchAllPermisos}
              startIcon={<RefreshIcon />}
            >
              Reintentar
            </Button>
          </Box>
        ) : (
          <>
            {tabValue === 0 ? renderAccordionView() : renderTableView()}
            
            {/* Paginación */}
            {tabValue === 1 && filteredPermisos.length > 0 && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Grid container alignItems="center" justifyContent="space-between">
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      Mostrando {paginatedPermisos.length} de {filteredPermisos.length} permisos filtrados
                      {filteredPermisos.length !== permisos.length && ` (de ${permisos.length} totales)`}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50, 100]}
                      component="div"
                      count={filteredPermisos.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      labelRowsPerPage="Filas por página:"
                      labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} de ${count}`
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Diálogo para crear/editar permiso */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">
              {isEditing ? 'Editar Permiso' : 'Nuevo Permiso'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="nombre"
                label="Nombre del Permiso *"
                value={permisoActual.nombre}
                onChange={handleNombreChange}
                size="small"
                required
                autoFocus
                helperText="Ej: 'Ver Usuarios', 'Crear Reportes'"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="codigo"
                label="Código del Permiso *"
                value={permisoActual.codigo}
                onChange={handleInputChange}
                size="small"
                required
                helperText="Formato: MAYUSCULAS_CON_GUIONES_BAJOS"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CodeIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                name="descripcion"
                label="Descripción"
                value={permisoActual.descripcion}
                onChange={handleInputChange}
                size="small"
                multiline
                rows={3}
                helperText="Describe el propósito y alcance de este permiso"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DescriptionIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={MODULOS_PREDEFINIDOS}
                value={permisoActual.modulo}
                onChange={handleModuloChange}
                onInputChange={(event, newValue) => {
                  setPermisoActual({
                    ...permisoActual,
                    modulo: newValue
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Módulo *"
                    margin="normal"
                    size="small"
                    required
                    helperText="Seleccione un módulo existente o escriba uno nuevo"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <CategoryIcon fontSize="small" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getModuloIcon(option)}
                      {option}
                    </Box>
                  </li>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Convenciones recomendadas:
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Chip label="VER" color="info" size="small" icon={<VisibilityIcon />} />
                  <Chip label="CREAR" color="success" size="small" icon={<CreateIcon />} />
                  <Chip label="EDITAR" color="warning" size="small" icon={<EditNoteIcon />} />
                  <Chip label="ELIMINAR" color="error" size="small" icon={<DeleteIcon />} />
                  <Chip label="EXPORTAR" color="secondary" size="small" icon={<FileDownloadIcon />} />
                  <Chip label="GENERAR" color="info" size="small" icon={<AssessmentIcon />} />
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSavePermiso}
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
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="info" />
            <Typography variant="h6">Detalles del Permiso</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {permisoSeleccionado && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: `${getPermisoColor(permisoSeleccionado.codigo)}.main`,
                        color: 'white',
                        fontSize: 32,
                        mr: 3
                      }}
                    >
                      {getPermisoIcon(permisoSeleccionado.codigo)}
                    </Avatar>
                    <Box>
                      <Typography variant="h4" gutterBottom>
                        {permisoSeleccionado.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                          label={permisoSeleccionado.codigo}
                          color={getPermisoColor(permisoSeleccionado.codigo)}
                          icon={<CodeIcon />}
                          sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                        <Chip
                          label={permisoSeleccionado.modulo}
                          color={getModuloColor(permisoSeleccionado.modulo)}
                          icon={getModuloIcon(permisoSeleccionado.modulo)}
                          variant="outlined"
                        />
                        <Chip
                          label={`ID: ${permisoSeleccionado.permisoid}`}
                          variant="outlined"
                          size="small"
                        />
                      </Box>
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
                  <Paper variant="outlined" sx={{ p: 3, borderRadius: 1, bgcolor: 'background.default' }}>
                    <Typography>
                      {permisoSeleccionado.descripcion}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    INFORMACIÓN TÉCNICA
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <List dense>
                      <ListItem>
                        <ListItemAvatar>
                          <CodeIcon color="action" />
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Código" 
                          secondary={
                            <Typography variant="body2" fontFamily="monospace">
                              {permisoSeleccionado.codigo}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <CategoryIcon color="action" />
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Módulo" 
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getModuloIcon(permisoSeleccionado.modulo)}
                              <Typography variant="body2">
                                {permisoSeleccionado.modulo}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <SecurityIcon color="action" />
                        </ListItemAvatar>
                        <ListItemText 
                          primary="ID del Permiso" 
                          secondary={`#${permisoSeleccionado.permisoid}`}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    TIPO DE PERMISO
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: `${getPermisoColor(permisoSeleccionado.codigo)}.main`,
                          color: 'white',
                          mx: 'auto',
                          mb: 2
                        }}
                      >
                        {getPermisoIcon(permisoSeleccionado.codigo)}
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        {permisoSeleccionado.codigo.includes('VER') && 'Permiso de Visualización'}
                        {permisoSeleccionado.codigo.includes('CREAR') && 'Permiso de Creación'}
                        {permisoSeleccionado.codigo.includes('EDITAR') && 'Permiso de Edición'}
                        {permisoSeleccionado.codigo.includes('ELIMINAR') && 'Permiso de Eliminación'}
                        {permisoSeleccionado.codigo.includes('EXPORTAR') && 'Permiso de Exportación'}
                        {permisoSeleccionado.codigo.includes('GENERAR') && 'Permiso de Generación'}
                        {!['VER', 'CREAR', 'EDITAR', 'ELIMINAR', 'EXPORTAR', 'GENERAR'].some(t => 
                          permisoSeleccionado.codigo.includes(t)
                        ) && 'Permiso Personalizado'}
                      </Typography>
                      <Chip 
                        label={permisoSeleccionado.codigo.includes('VER') ? 'Solo lectura' : 
                               permisoSeleccionado.codigo.includes('CREAR') ? 'Escritura' :
                               permisoSeleccionado.codigo.includes('EDITAR') ? 'Modificación' :
                               permisoSeleccionado.codigo.includes('ELIMINAR') ? 'Administración' :
                               permisoSeleccionado.codigo.includes('EXPORTAR') ? 'Exportación' :
                               permisoSeleccionado.codigo.includes('GENERAR') ? 'Generación' : 'Personalizado'}
                        color={getPermisoColor(permisoSeleccionado.codigo)}
                        size="small"
                      />
                    </Box>
                  </Paper>
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
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            <Typography variant="h6">Confirmar Eliminación</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {permisoAEliminar && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                ¡Atención! Esta acción no se puede deshacer
              </Alert>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: `${getPermisoColor(permisoAEliminar.codigo)}.main`,
                          color: 'white',
                          mr: 2
                        }}
                      >
                        {getPermisoIcon(permisoAEliminar.codigo)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {permisoAEliminar.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {permisoAEliminar.codigo}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Descripción:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {permisoAEliminar.descripcion}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Módulo:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getModuloIcon(permisoAEliminar.modulo)}
                      <Typography variant="body1">
                        {permisoAEliminar.modulo}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID:
                    </Typography>
                    <Typography variant="body1">
                      #{permisoAEliminar.permisoid}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Alert severity="error" sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        Advertencia:
                      </Typography>
                      <Typography variant="body2">
                        Este permiso podría estar asignado a roles existentes. 
                        Su eliminación podría afectar el acceso de usuarios.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleDeletePermiso}
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
              Información del Sistema - Permisos
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              • Total de permisos cargados: {permisos.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Módulos únicos: {stats.modulosUnicos}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Mostrando {filteredPermisos.length} de {permisos.length} permisos
              {filteredPermisos.length !== permisos.length && ' (filtrados)'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              • Distribución por módulo:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
              {stats.permisosPorModulo.slice(0, 5).map((item) => (
                <Chip
                  key={item.modulo}
                  label={`${item.modulo}: ${item.cantidad}`}
                  size="small"
                  color={getModuloColor(item.modulo)}
                  variant="outlined"
                />
              ))}
              {stats.permisosPorModulo.length > 5 && (
                <Chip
                  label={`+${stats.permisosPorModulo.length - 5} más`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default PermisosCRUD;