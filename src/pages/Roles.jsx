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
  Zoom,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Avatar,
  Badge,
  Rating,
  Tabs,
  Tab
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
  // Iconos para roles
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  StarHalf as StarHalfIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Group as GroupIcon,
  AssignmentInd as AssignmentIndIcon,
  Info as InfoIcon,
  ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';

// URL de la API
const API_URL = 'http://127.0.0.1:8000/api/roles/';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const getApiErrorMessage = async (response, fallback = 'Error en la solicitud') => {
  try {
    const text = await response.text();
    if (!text) return `${fallback} (${response.status})`;
    try {
      const data = JSON.parse(text);
      const detail =
        data?.detail ||
        data?.message ||
        data?.error ||
        data?.errors?.detail ||
        (Array.isArray(data?.non_field_errors) ? data.non_field_errors.join(', ') : null);
      return detail ? String(detail) : `${fallback} (${response.status})`;
    } catch {
      return text;
    }
  } catch {
    return `${fallback} (${response.status})`;
  }
};

// Componente principal de Roles
const RolesCRUD = () => {
  // Estados para los roles
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
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
  
  // Estado para el rol actual (para edición/creación)
  const [rolActual, setRolActual] = useState({
    nombre: '',
    descripcion: '',
    nivelacceso: 2,
    activo: true
  });
  
  // Estado para el rol a eliminar
  const [rolAEliminar, setRolAEliminar] = useState(null);
  
  // Estado para el rol seleccionado para detalles
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  
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
  const [filterNivel, setFilterNivel] = useState('all'); // 'all', '1', '2', '3', '4'
  const [sortBy, setSortBy] = useState('nivelacceso'); // 'nombre', 'nivelacceso'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  
  // Estado para tabs de vista
  const [tabValue, setTabValue] = useState(0);
  
  // Estado para menú contextual
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Niveles de acceso con descripciones
  const nivelesAcceso = [
    { nivel: 1, label: 'Consulta', color: 'info', icon: <ViewIcon /> },
    { nivel: 2, label: 'Usuario', color: 'success', icon: <PersonIcon /> },
    { nivel: 3, label: 'Supervisor', color: 'warning', icon: <SupervisorIcon /> },
    { nivel: 4, label: 'Administrador', color: 'error', icon: <AdminIcon /> }
  ];

  // Función para obtener roles
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_URL, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setRoles(data.results);
      setFilteredRoles(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error al cargar roles: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar roles al montar el componente
  useEffect(() => {
    fetchRoles();
  }, []);

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let result = [...roles];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(rol => 
        rol.nombre.toLowerCase().includes(term) ||
        rol.descripcion.toLowerCase().includes(term)
      );
    }
    
    // Aplicar filtro de estado
    if (filterActive === 'active') {
      result = result.filter(rol => rol.activo === true);
    } else if (filterActive === 'inactive') {
      result = result.filter(rol => rol.activo === false);
    }
    
    // Aplicar filtro de nivel
    if (filterNivel !== 'all') {
      result = result.filter(rol => rol.nivelacceso === parseInt(filterNivel));
    }
    
    // Aplicar ordenamiento
    result.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'nombre') {
        aValue = a.nombre.toLowerCase();
        bValue = b.nombre.toLowerCase();
      } else if (sortBy === 'nivelacceso') {
        aValue = a.nivelacceso;
        bValue = b.nivelacceso;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredRoles(result);
    setPage(0); // Resetear a la primera página al filtrar
  }, [roles, searchTerm, filterActive, filterNivel, sortBy, sortOrder]);

  // Manejar cambio de pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Abrir diálogo para crear nuevo rol
  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setRolActual({
      nombre: '',
      descripcion: '',
      nivelacceso: 2,
      activo: true
    });
    setOpenDialog(true);
  };

  // Abrir diálogo para editar rol
  const handleOpenEditDialog = (rol) => {
    setIsEditing(true);
    setRolActual(rol);
    setOpenDialog(true);
  };

  // Abrir diálogo de detalles
  const handleOpenDetailsDialog = (rol) => {
    setRolSeleccionado(rol);
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
    setRolActual({
      ...rolActual,
      [name]: type === 'checkbox' ? checked : (name === 'nivelacceso' ? parseInt(value) : value)
    });
  };

  // Guardar rol (crear o actualizar)
  const handleSaveRol = async () => {
    // Validaciones
    if (!rolActual.nombre.trim()) {
      setSnackbar({
        open: true,
        message: 'El nombre del rol es obligatorio',
        severity: 'warning'
      });
      return;
    }

    if (!rolActual.nivelacceso || rolActual.nivelacceso < 1 || rolActual.nivelacceso > 4) {
      setSnackbar({
        open: true,
        message: 'El nivel de acceso debe estar entre 1 y 4',
        severity: 'warning'
      });
      return;
    }

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_URL}${rolActual.rolid}/` : API_URL;
      const payload = {
        nombre: rolActual.nombre,
        descripcion: rolActual.descripcion,
        nivelacceso: rolActual.nivelacceso,
        activo: !!rolActual.activo
      };
      
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const msg = await getApiErrorMessage(response, 'No se pudo guardar el rol');
        throw new Error(msg);
      }

      // Actualizar lista de roles
      await fetchRoles();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: `Rol ${isEditing ? 'actualizado' : 'creado'} correctamente`,
        severity: 'success'
      });
      
      // Cerrar diálogo
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error al guardar rol: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (rol) => {
    setRolAEliminar(rol);
    setOpenDeleteDialog(true);
  };

  // Eliminar rol
  const handleDeleteRol = async () => {
    if (!rolAEliminar) return;

    try {
      const response = await fetch(`${API_URL}${rolAEliminar.rolid}/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const msg = await getApiErrorMessage(response, 'No se pudo eliminar el rol');
        if (response.status >= 500) {
          // Fallback: baja lógica si la eliminación física falla por relaciones en BD
          const softDeletePayload = {
            nombre: rolAEliminar.nombre,
            descripcion: rolAEliminar.descripcion,
            nivelacceso: rolAEliminar.nivelacceso,
            activo: false
          };

          const softDeleteResponse = await fetch(`${API_URL}${rolAEliminar.rolid}/`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(softDeletePayload)
          });

          if (softDeleteResponse.ok) {
            await fetchRoles();
            setSnackbar({
              open: true,
              message: 'No se pudo eliminar físicamente; rol desactivado correctamente',
              severity: 'warning'
            });
            return;
          }
        }
        throw new Error(msg);
      }

      // Actualizar lista de roles
      await fetchRoles();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: 'Rol eliminado correctamente',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error al eliminar rol: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setOpenDeleteDialog(false);
      setRolAEliminar(null);
    }
  };

  // Cerrar diálogo de eliminación
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setRolAEliminar(null);
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
    setFilterNivel('all');
    setSortBy('nivelacceso');
    setSortOrder('desc');
  };

  // Cambiar estado activo/inactivo
  const handleToggleStatus = async (rol) => {
    try {
      const updatedRol = {
        ...rol,
        activo: !rol.activo
      };

      const response = await fetch(`${API_URL}${rol.rolid}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedRol)
      });

      if (!response.ok) {
        const msg = await getApiErrorMessage(response, 'No se pudo actualizar el estado del rol');
        throw new Error(msg);
      }

      // Actualizar lista de roles
      await fetchRoles();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: `Rol ${updatedRol.activo ? 'activado' : 'desactivado'} correctamente`,
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

  // Obtener información del nivel de acceso
  const getNivelInfo = (nivel) => {
    return nivelesAcceso.find(n => n.nivel === nivel) || nivelesAcceso[0];
  };

  // Obtener icono según el nombre del rol
  const getRolIcon = (rolNombre) => {
    const nombre = rolNombre.toLowerCase();
    if (nombre.includes('admin')) return <AdminIcon />;
    if (nombre.includes('supervisor')) return <SupervisorIcon />;
    if (nombre.includes('usuario')) return <PersonIcon />;
    if (nombre.includes('consulta')) return <ViewIcon />;
    return <SecurityIcon />;
  };

  // Formatear color para nivel de acceso
  const getNivelColor = (nivel) => {
    switch(nivel) {
      case 1: return 'info';
      case 2: return 'success';
      case 3: return 'warning';
      case 4: return 'error';
      default: return 'default';
    }
  };

  // Manejar menú contextual
  const handleMenuOpen = (event, rolid) => {
    setAnchorEl(event.currentTarget);
    setSelectedRowId(rolid);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRowId(null);
  };

  // Obtener rol por ID
  const getRolById = (id) => {
    return roles.find(rol => rol.rolid === id);
  };

  // Estadísticas
  const stats = {
    total: roles.length,
    activos: roles.filter(rol => rol.activo === true).length,
    inactivos: roles.filter(rol => rol.activo === false).length,
    niveles: {
      1: roles.filter(rol => rol.nivelacceso === 1).length,
      2: roles.filter(rol => rol.nivelacceso === 2).length,
      3: roles.filter(rol => rol.nivelacceso === 3).length,
      4: roles.filter(rol => rol.nivelacceso === 4).length
    }
  };

  // Datos paginados
  const paginatedRoles = filteredRoles.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Vista de tarjetas
  const renderCardView = () => (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {paginatedRoles.map((rol) => {
        const nivelInfo = getNivelInfo(rol.nivelacceso);
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={rol.rolid}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: rol.activo ? 1 : 0.7,
                border: rol.activo ? 'none' : '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                {/* Badge de estado */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                  <Chip
                    size="small"
                    label={rol.activo ? 'Activo' : 'Inactivo'}
                    color={rol.activo ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
                
                {/* Icono del rol */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: `${getNivelColor(rol.nivelacceso)}.main`,
                      color: 'white'
                    }}
                  >
                    {getRolIcon(rol.nombre)}
                  </Avatar>
                </Box>
                
                {/* Nombre del rol */}
                <Typography 
                  variant="h6" 
                  align="center" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold',
                    color: 'text.primary'
                  }}
                >
                  {rol.nombre}
                </Typography>
                
                {/* Descripción */}
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  align="center"
                  sx={{
                    mb: 2,
                    height: 40,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {rol.descripcion}
                </Typography>
                
                {/* Nivel de acceso */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {nivelInfo.icon}
                    <Typography variant="body2" sx={{ ml: 1, fontWeight: 'medium' }}>
                      {nivelInfo.label}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Barra de nivel */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Nivel de acceso: {rol.nivelacceso}/4
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(rol.nivelacceso / 4) * 100}
                    color={getNivelColor(rol.nivelacceso)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
                
                {/* ID del rol */}
                <Typography variant="caption" color="text.secondary" display="block" align="center">
                  ID: #{rol.rolid}
                </Typography>
              </CardContent>
              
              {/* Acciones */}
              <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                <Tooltip title="Ver detalles">
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => handleOpenDetailsDialog(rol)}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Box>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEditDialog(rol)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={rol.activo ? 'Desactivar' : 'Activar'}>
                    <IconButton
                      size="small"
                      color={rol.activo ? 'warning' : 'success'}
                      onClick={() => handleToggleStatus(rol)}
                    >
                      {rol.activo ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleConfirmDelete(rol)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  // Vista de tabla
  const renderTableView = () => (
    <TableContainer sx={{ maxHeight: 500 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Rol</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell>Nivel de Acceso</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedRoles.map((rol) => {
            const nivelInfo = getNivelInfo(rol.nivelacceso);
            return (
              <TableRow 
                key={rol.rolid} 
                hover
                sx={{ 
                  '&:hover': { 
                    backgroundColor: alpha('#000', 0.04) 
                  },
                  opacity: rol.activo ? 1 : 0.7
                }}
              >
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    #{rol.rolid}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: `${nivelInfo.color}.light`,
                        color: `${nivelInfo.color}.main`,
                        mr: 2
                      }}
                    >
                      {getRolIcon(rol.nombre)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight="medium">
                        {rol.nombre}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={rol.descripcion} arrow>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {rol.descripcion}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {nivelInfo.icon}
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {nivelInfo.label}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating
                          value={rol.nivelacceso}
                          max={4}
                          readOnly
                          size="small"
                          icon={<StarIcon fontSize="inherit" />}
                          emptyIcon={<StarBorderIcon fontSize="inherit" />}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          (Nivel {rol.nivelacceso})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={rol.activo ? <CheckCircleIcon /> : <CancelIcon />}
                    label={rol.activo ? 'Activo' : 'Inactivo'}
                    color={rol.activo ? 'success' : 'error'}
                    size="small"
                    variant={rol.activo ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 'medium' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        color="info"
                        onClick={() => handleOpenDetailsDialog(rol)}
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Editar">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(rol)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={rol.activo ? 'Desactivar' : 'Activar'}>
                      <IconButton
                        color={rol.activo ? 'warning' : 'success'}
                        onClick={() => handleToggleStatus(rol)}
                        size="small"
                      >
                        {rol.activo ? <LockIcon /> : <LockOpenIcon />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Eliminar">
                      <IconButton
                        color="error"
                        onClick={() => handleConfirmDelete(rol)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
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
            Gestión de Roles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra los roles y permisos del sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          sx={{ borderRadius: 2 }}
        >
          Nuevo Rol
        </Button>
      </Box>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
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
                <GroupIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Roles</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
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
                <Typography variant="h6">Roles Activos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.activos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
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
                <Typography variant="h6">Roles Inactivos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.inactivos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              bgcolor: 'warning.main', 
              color: 'white',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Nivel Máximo</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {Math.max(...roles.map(r => r.nivelacceso), 0)}/4
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Panel de búsqueda y filtros */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Buscar roles"
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
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Nivel de Acceso</InputLabel>
              <Select
                value={filterNivel}
                label="Nivel de Acceso"
                onChange={(e) => setFilterNivel(e.target.value)}
              >
                <MenuItem value="all">Todos los niveles</MenuItem>
                {nivelesAcceso.map((nivel) => (
                  <MenuItem key={nivel.nivel} value={nivel.nivel}>
                    {nivel.label} (Nivel {nivel.nivel})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
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
            </Box>
          </Grid>
          
          <Grid item xs={12} md={2}>
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
            icon={<AssignmentIndIcon />} 
            label="Vista de Tarjetas" 
            iconPosition="start"
          />
          <Tab 
            icon={<ManageAccountsIcon />} 
            label="Vista de Tabla" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Contenido principal */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: 2, p: tabValue === 0 ? 3 : 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="h6" gutterBottom>
              Error al cargar roles
            </Typography>
            <Typography color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchRoles}
              startIcon={<RefreshIcon />}
            >
              Reintentar
            </Button>
          </Box>
        ) : (
          <>
            {tabValue === 0 ? renderCardView() : renderTableView()}
            
            {/* Paginación */}
            {tabValue === 1 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredRoles.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count} roles`
                }
                sx={{ borderTop: 1, borderColor: 'divider' }}
              />
            )}
          </>
        )}
      </Paper>

      {/* Diálogo para crear/editar rol */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">
              {isEditing ? 'Editar Rol' : 'Nuevo Rol'}
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
                label="Nombre del Rol *"
                value={rolActual.nombre}
                onChange={handleInputChange}
                size="small"
                required
                autoFocus
                helperText="Nombre único del rol (ej: Administrador, Usuario)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                name="descripcion"
                label="Descripción"
                value={rolActual.descripcion}
                onChange={handleInputChange}
                size="small"
                multiline
                rows={3}
                helperText="Descripción detallada de los permisos del rol"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Nivel de Acceso *</InputLabel>
                <Select
                  name="nivelacceso"
                  value={rolActual.nivelacceso}
                  onChange={handleInputChange}
                  label="Nivel de Acceso *"
                >
                  {nivelesAcceso.map((nivel) => (
                    <MenuItem key={nivel.nivel} value={nivel.nivel}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {nivel.icon}
                        <Box>
                          <Typography>{nivel.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Nivel {nivel.nivel} - {nivel.nivel === 1 ? 'Solo lectura' : 
                              nivel.nivel === 2 ? 'Acceso básico' : 
                              nivel.nivel === 3 ? 'Acceso supervisor' : 
                              'Acceso completo'}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="activo"
                    checked={rolActual.activo === true}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Rol Activo"
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                Los roles inactivos no estarán disponibles para asignación
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveRol}
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
            <Typography variant="h6">Detalles del Rol</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {rolSeleccionado && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: `${getNivelColor(rolSeleccionado.nivelacceso)}.main`,
                        color: 'white',
                        mr: 2
                      }}
                    >
                      {getRolIcon(rolSeleccionado.nombre)}
                    </Avatar>
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        {rolSeleccionado.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={rolSeleccionado.activo ? 'ACTIVO' : 'INACTIVO'}
                          color={rolSeleccionado.activo ? 'success' : 'error'}
                          size="small"
                        />
                        <Chip
                          label={`Nivel ${rolSeleccionado.nivelacceso}`}
                          color={getNivelColor(rolSeleccionado.nivelacceso)}
                          size="small"
                          variant="outlined"
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
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}
                  >
                    <Typography>
                      {rolSeleccionado.descripcion}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    INFORMACIÓN DEL NIVEL DE ACCESO
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'background.default',
                      borderRadius: 1
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getNivelInfo(rolSeleccionado.nivelacceso).icon}
                            <Typography variant="body1" sx={{ ml: 1, fontWeight: 'medium' }}>
                              {getNivelInfo(rolSeleccionado.nivelacceso).label}
                            </Typography>
                          </Box>
                          <Typography variant="h6" color="primary">
                            Nivel {rolSeleccionado.nivelacceso}/4
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <LinearProgress 
                          variant="determinate" 
                          value={(rolSeleccionado.nivelacceso / 4) * 100}
                          color={getNivelColor(rolSeleccionado.nivelacceso)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Rating
                          value={rolSeleccionado.nivelacceso}
                          max={4}
                          readOnly
                          size="large"
                          icon={<StarIcon fontSize="inherit" />}
                          emptyIcon={<StarBorderIcon fontSize="inherit" />}
                        />
                      </Grid>
                    </Grid>
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
                        <Typography variant="body2">ID del Rol:</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="medium">
                        #{rolSeleccionado.rolid}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon />
            <Typography variant="h6">Confirmar Eliminación</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {rolAEliminar && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                ¡Atención! Esta acción no se puede deshacer
              </Alert>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nombre del Rol:
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {rolAEliminar.nombre}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID:
                    </Typography>
                    <Typography variant="body1">
                      #{rolAEliminar.rolid}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nivel de Acceso:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={`Nivel ${rolAEliminar.nivelacceso}`}
                        color={getNivelColor(rolAEliminar.nivelacceso)}
                      />
                      <Typography variant="body2">
                        {getNivelInfo(rolAEliminar.nivelacceso).label}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Estado:
                    </Typography>
                    <Chip
                      size="small"
                      label={rolAEliminar.activo ? 'Activo' : 'Inactivo'}
                      color={rolAEliminar.activo ? 'success' : 'error'}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Descripción:
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      {rolAEliminar.descripcion}
                    </Typography>
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
            onClick={handleDeleteRol}
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
              Información del Sistema - Roles
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              • Total de roles en sistema: {stats.total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Roles activos: {stats.activos} ({stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0}%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Roles inactivos: {stats.inactivos} ({stats.total > 0 ? Math.round((stats.inactivos / stats.total) * 100) : 0}%)
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              • Distribución por nivel:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {nivelesAcceso.map((nivel) => (
                <Chip
                  key={nivel.nivel}
                  label={`N${nivel.nivel}: ${stats.niveles[nivel.nivel] || 0}`}
                  size="small"
                  color={nivel.color}
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default RolesCRUD;
