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
  Avatar,
  Badge,
  Tabs,
  Tab,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Toolbar,
  InputBase
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
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  LockReset as LockResetIcon,
  Block as BlockIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  AssignmentInd as AssignmentIndIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon,
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  AccountCircle as AccountCircleIcon,
  Password as PasswordIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SupervisorIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon
} from '@mui/icons-material';

// URLs de las APIs
const API_URL = 'http://127.0.0.1:8000/api/usuarios/';
const API_DEPARTAMENTOS = 'http://127.0.0.1:8000/api/departamentos/';
const API_ROLES = 'http://127.0.0.1:8000/api/roles/';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const getApiErrorMessage = async (response, fallback = 'Error en la solicitud') => {
  try {
    const data = await response.json();
    // Intentar extraer el mensaje de error de diferentes formatos comunes
    const errorMessage = 
      data?.detail ||
      data?.message ||
      data?.error ||
      data?.errors?.detail ||
      (data?.non_field_errors && data.non_field_errors.join(', ')) ||
      (typeof data === 'string' ? data : null);
    
    return errorMessage || `${fallback} (${response.status})`;
  } catch {
    return `${fallback} (${response.status})`;
  }
};

// Componente para manejar paginación personalizada
const PaginationControls = ({ page, count, rowsPerPage, onPageChange, onRowsPerPageChange }) => {
  const totalPages = Math.ceil(count / rowsPerPage);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Filas por página</InputLabel>
        <Select
          value={rowsPerPage}
          label="Filas por página"
          onChange={onRowsPerPageChange}
        >
          {[10, 25, 50, 100].map((rows) => (
            <MenuItem key={rows} value={rows}>
              {rows}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Typography variant="body2" sx={{ ml: 2 }}>
        {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, count)} de {count}
      </Typography>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <IconButton
        onClick={() => onPageChange(0)}
        disabled={page === 0}
        size="small"
      >
        <FirstPageIcon />
      </IconButton>
      
      <IconButton
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        size="small"
      >
        <KeyboardArrowLeftIcon />
      </IconButton>
      
      <Typography variant="body2">
        Página {page + 1} de {totalPages || 1}
      </Typography>
      
      <IconButton
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        size="small"
      >
        <KeyboardArrowRightIcon />
      </IconButton>
      
      <IconButton
        onClick={() => onPageChange(totalPages - 1)}
        disabled={page >= totalPages - 1}
        size="small"
      >
        <LastPageIcon />
      </IconButton>
    </Box>
  );
};

// Componente principal de Usuarios
const UsuariosCRUD = () => {
  // Estados para los usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para paginación de API
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Estados para datos relacionados
  const [departamentos, setDepartamentos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  
  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openResetPasswordDialog, setOpenResetPasswordDialog] = useState(false);
  const [openUnlockDialog, setOpenUnlockDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para el usuario actual (para edición/creación)
  const [usuarioActual, setUsuarioActual] = useState({
    nombre: '',
    apellido: '',
    email: '',
    nombreusuario: '',
    passwordhash: '', // Cambiado de 'password' a 'passwordhash'
    activo: true,
    departamentoid: '',
    rolid: ''
  });
  
  // Estados para acciones especiales
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [usuarioParaReset, setUsuarioParaReset] = useState(null);
  const [usuarioParaDesbloquear, setUsuarioParaDesbloquear] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [filterBloqueado, setFilterBloqueado] = useState('all');
  const [filterDepartamento, setFilterDepartamento] = useState('all');
  const [filterRol, setFilterRol] = useState('all');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Estado para tabs de vista
  const [tabValue, setTabValue] = useState(0);
  
  // Estado para menú contextual
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const openMenu = Boolean(anchorEl);

  // Interceptor para fetch (debugging)
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, config] = args;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 ${config?.method || 'GET'} ${url}`, config?.body ? JSON.parse(config.body) : '');
      }
      
      const response = await originalFetch(...args);
      
      if (!response.ok && process.env.NODE_ENV === 'development') {
        const clone = response.clone();
        try {
          const errorData = await clone.json();
          console.error('❌ Error response:', errorData);
        } catch {
          console.error('❌ Error status:', response.status);
        }
      }
      
      return response;
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Función para obtener TODOS los usuarios (sin paginación del lado del cliente)
  const fetchAllUsuarios = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let allUsuarios = [];
      let nextPage = API_URL;
      let page = 1;
      
      // Recorrer todas las páginas
      while (nextPage) {
        const response = await fetch(nextPage, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        
        allUsuarios = [...allUsuarios, ...data.results];
        nextPage = data.next;
        page++;
        
        // Pequeña pausa para no sobrecargar el servidor
        if (nextPage) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setUsuarios(allUsuarios);
      setFilteredUsuarios(allUsuarios);
      setTotalCount(allUsuarios.length);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error al cargar usuarios: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener datos relacionados
  const fetchRelatedData = async () => {
    setLoadingRelated(true);
    try {
      // Obtener departamentos
      const deptResponse = await fetch(API_DEPARTAMENTOS, {
        headers: getAuthHeaders()
      });
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartamentos(deptData.results || []);
      }
      
      // Obtener roles
      const rolesResponse = await fetch(API_ROLES, {
        headers: getAuthHeaders()
      });
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.results || []);
      }
    } catch (err) {
      console.error('Error al cargar datos relacionados:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAllUsuarios();
    fetchRelatedData();
  }, []);

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let result = [...usuarios];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(usuario => 
        usuario.nombre?.toLowerCase().includes(term) ||
        usuario.apellido?.toLowerCase().includes(term) ||
        usuario.email?.toLowerCase().includes(term) ||
        usuario.nombreusuario?.toLowerCase().includes(term)
      );
    }
    
    // Aplicar filtro de estado activo
    if (filterActive === 'active') {
      result = result.filter(usuario => usuario.activo === true);
    } else if (filterActive === 'inactive') {
      result = result.filter(usuario => usuario.activo === false);
    }
    
    // Aplicar filtro de bloqueo
    if (filterBloqueado === 'blocked') {
      result = result.filter(usuario => usuario.bloqueado === true);
    } else if (filterBloqueado === 'unblocked') {
      result = result.filter(usuario => usuario.bloqueado === false);
    }
    
    // Aplicar filtro de departamento
    if (filterDepartamento !== 'all') {
      result = result.filter(usuario => usuario.departamentoid === parseInt(filterDepartamento));
    }
    
    // Aplicar filtro de rol
    if (filterRol !== 'all') {
      result = result.filter(usuario => usuario.rolid === parseInt(filterRol));
    }
    
    // Aplicar ordenamiento
    result.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'nombre') {
        aValue = `${a.nombre} ${a.apellido}`.toLowerCase();
        bValue = `${b.nombre} ${b.apellido}`.toLowerCase();
      } else if (sortBy === 'email') {
        aValue = a.email?.toLowerCase() || '';
        bValue = b.email?.toLowerCase() || '';
      } else if (sortBy === 'fechacreacion') {
        aValue = new Date(a.fechacreacion || 0);
        bValue = new Date(b.fechacreacion || 0);
      } else if (sortBy === 'intentosfallidos') {
        aValue = a.intentosfallidos || 0;
        bValue = b.intentosfallidos || 0;
      } else {
        aValue = a[sortBy] || '';
        bValue = b[sortBy] || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredUsuarios(result);
    setPage(0);
  }, [usuarios, searchTerm, filterActive, filterBloqueado, filterDepartamento, filterRol, sortBy, sortOrder]);

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

  // Abrir diálogo para crear nuevo usuario
  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setUsuarioActual({
      nombre: '',
      apellido: '',
      email: '',
      nombreusuario: '',
      passwordhash: '', // Cambiado de 'password' a 'passwordhash'
      activo: true,
      departamentoid: '',
      rolid: ''
    });
    setOpenDialog(true);
  };

  // Abrir diálogo para editar usuario
  const handleOpenEditDialog = (usuario) => {
    if (!usuario?.usuarioid) {
      console.error('Usuario sin ID:', usuario);
      setSnackbar({
        open: true,
        message: 'Error: Usuario no válido para editar',
        severity: 'error'
      });
      return;
    }
    
    setIsEditing(true);
    setUsuarioActual({
      usuarioid: usuario.usuarioid,
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      nombreusuario: usuario.nombreusuario || '',
      passwordhash: '', // No mostrar password actual - cambiado de 'password' a 'passwordhash'
      activo: usuario.activo === true,
      departamentoid: usuario.departamentoid || '',
      rolid: usuario.rolid || ''
    });
    setOpenDialog(true);
  };

  // Abrir diálogo de detalles
  const handleOpenDetailsDialog = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setOpenDetailsDialog(true);
  };

  // Abrir diálogo para resetear contraseña
  const handleOpenResetPasswordDialog = (usuario) => {
    setUsuarioParaReset(usuario);
    setOpenResetPasswordDialog(true);
  };

  // Abrir diálogo para desbloquear usuario
  const handleOpenUnlockDialog = (usuario) => {
    setUsuarioParaDesbloquear(usuario);
    setOpenUnlockDialog(true);
  };

  // Cerrar diálogos
  const handleCloseDialog = () => setOpenDialog(false);
  const handleCloseDetailsDialog = () => setOpenDetailsDialog(false);
  const handleCloseResetPasswordDialog = () => setOpenResetPasswordDialog(false);
  const handleCloseUnlockDialog = () => setOpenUnlockDialog(false);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUsuarioActual({
      ...usuarioActual,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Validar email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar formulario
  const validateForm = () => {
    if (!usuarioActual.nombre?.trim()) {
      setSnackbar({
        open: true,
        message: 'El nombre es obligatorio',
        severity: 'warning'
      });
      return false;
    }
    
    if (!usuarioActual.apellido?.trim()) {
      setSnackbar({
        open: true,
        message: 'El apellido es obligatorio',
        severity: 'warning'
      });
      return false;
    }
    
    if (!usuarioActual.email?.trim() || !isValidEmail(usuarioActual.email)) {
      setSnackbar({
        open: true,
        message: 'Ingrese un email válido',
        severity: 'warning'
      });
      return false;
    }
    
    if (!usuarioActual.nombreusuario?.trim()) {
      setSnackbar({
        open: true,
        message: 'El nombre de usuario es obligatorio',
        severity: 'warning'
      });
      return false;
    }
    
    if (!isEditing && !usuarioActual.passwordhash?.trim()) { // Cambiado de 'password' a 'passwordhash'
      setSnackbar({
        open: true,
        message: 'La contraseña es obligatoria para nuevos usuarios',
        severity: 'warning'
      });
      return false;
    }
    
    if (!usuarioActual.departamentoid) {
      setSnackbar({
        open: true,
        message: 'Seleccione un departamento',
        severity: 'warning'
      });
      return false;
    }
    
    if (!usuarioActual.rolid) {
      setSnackbar({
        open: true,
        message: 'Seleccione un rol',
        severity: 'warning'
      });
      return false;
    }
    
    return true;
  };

  // Guardar usuario (crear o actualizar)
  const handleSaveUsuario = async () => {
    if (!validateForm()) return;

    try {
      const method = isEditing ? 'PUT' : 'POST';
      
      // Verificar que tenemos ID para edición
      if (isEditing && !usuarioActual.usuarioid) {
        throw new Error('ID de usuario no encontrado para edición');
      }
      
      const url = isEditing ? `${API_URL}${usuarioActual.usuarioid}/` : API_URL;
      
      // Construir datos a enviar - Usar los campos que espera el backend
      const userData = {
        nombre: usuarioActual.nombre.trim(),
        apellido: usuarioActual.apellido.trim(),
        email: usuarioActual.email.trim().toLowerCase(),
        nombreusuario: usuarioActual.nombreusuario.trim().toLowerCase(),
        activo: usuarioActual.activo === true,
        departamentoid: Number(usuarioActual.departamentoid),
        rolid: Number(usuarioActual.rolid)
      };
      
      // IMPORTANTE: El backend espera 'passwordhash' no 'password'
      if (!isEditing || usuarioActual.passwordhash?.trim()) {
        userData.passwordhash = usuarioActual.passwordhash; // Cambiado de 'password' a 'passwordhash'
      }

      console.log('Enviando datos:', userData); // Para debugging

      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        
        // Extraer mensaje de error detallado
        let errorMessage = '';
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.email) {
          errorMessage = `Email: ${errorData.email.join(', ')}`;
        } else if (errorData.nombreusuario) {
          errorMessage = `Usuario: ${errorData.nombreusuario.join(', ')}`;
        } else if (errorData.passwordhash) { // Cambiado de 'password' a 'passwordhash'
          errorMessage = `Contraseña: ${errorData.passwordhash.join(', ')}`;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors.join(', ');
        } else {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json().catch(() => ({}));
      console.log('Respuesta exitosa:', responseData);

      // Recargar todos los usuarios
      await fetchAllUsuarios();
      
      setSnackbar({
        open: true,
        message: `Usuario ${isEditing ? 'actualizado' : 'creado'} correctamente`,
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (err) {
      console.error('Error en handleSaveUsuario:', err);
      setSnackbar({
        open: true,
        message: `Error al guardar usuario: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (usuario) => {
    if (!usuario?.usuarioid) {
      setSnackbar({
        open: true,
        message: 'Error: Usuario no válido para eliminar',
        severity: 'error'
      });
      return;
    }
    setUsuarioAEliminar(usuario);
    setOpenDeleteDialog(true);
  };

  // Eliminar usuario
  const handleDeleteUsuario = async () => {
    if (!usuarioAEliminar?.usuarioid) return;

    try {
      console.log('Eliminando usuario:', usuarioAEliminar.usuarioid);
      
      const response = await fetch(`${API_URL}${usuarioAEliminar.usuarioid}/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        // Si hay error 500, intentar desactivar en lugar de eliminar
        if (response.status === 500) {
          console.log('Error 500 en DELETE, intentando desactivar usuario...');
          
          // Intentar desactivar el usuario en lugar de eliminarlo
          const deactivateResponse = await fetch(`${API_URL}${usuarioAEliminar.usuarioid}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ activo: false })
          });

          if (deactivateResponse.ok) {
            await fetchAllUsuarios();
            setSnackbar({
              open: true,
              message: 'Usuario desactivado correctamente (no se pudo eliminar físicamente)',
              severity: 'warning'
            });
            setOpenDeleteDialog(false);
            setUsuarioAEliminar(null);
            return;
          }
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      await fetchAllUsuarios();
      
      setSnackbar({
        open: true,
        message: 'Usuario eliminado correctamente',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error en handleDeleteUsuario:', err);
      setSnackbar({
        open: true,
        message: `Error al eliminar usuario: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setOpenDeleteDialog(false);
      setUsuarioAEliminar(null);
    }
  };

  // Resetear contraseña
  const handleResetPassword = async () => {
    if (!usuarioParaReset?.usuarioid) return;

    try {
      // Generar contraseña aleatoria
      const nuevaPassword = Math.random().toString(36).slice(-8) + 'A1!';
      
      const response = await fetch(`${API_URL}${usuarioParaReset.usuarioid}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ passwordhash: nuevaPassword }) // Cambiado de 'password' a 'passwordhash'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'No se pudo resetear la contraseña');
      }

      setSnackbar({
        open: true,
        message: `Contraseña reseteada correctamente. Nueva contraseña: ${nuevaPassword}`,
        severity: 'success'
      });
      
      handleCloseResetPasswordDialog();
    } catch (err) {
      console.error('Error al resetear contraseña:', err);
      setSnackbar({
        open: true,
        message: `Error al resetear contraseña: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Desbloquear usuario
  const handleUnlockUser = async () => {
    if (!usuarioParaDesbloquear?.usuarioid) return;

    try {
      const response = await fetch(`${API_URL}${usuarioParaDesbloquear.usuarioid}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bloqueado: false,
          intentosfallidos: 0,
          fechabloqueo: null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'No se pudo desbloquear el usuario');
      }

      await fetchAllUsuarios();
      
      setSnackbar({
        open: true,
        message: 'Usuario desbloqueado correctamente',
        severity: 'success'
      });
      
      handleCloseUnlockDialog();
    } catch (err) {
      console.error('Error al desbloquear usuario:', err);
      setSnackbar({
        open: true,
        message: `Error al desbloquear usuario: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Cambiar estado activo/inactivo
  const handleToggleStatus = async (usuario) => {
    if (!usuario?.usuarioid) return;
    
    try {
      const response = await fetch(`${API_URL}${usuario.usuarioid}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          activo: !usuario.activo
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al cambiar estado');
      }

      await fetchAllUsuarios();
      
      setSnackbar({
        open: true,
        message: `Usuario ${!usuario.activo ? 'activado' : 'desactivado'} correctamente`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setSnackbar({
        open: true,
        message: `Error al cambiar estado: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Limpiar búsqueda y filtros
  const handleClearSearch = () => {
    setSearchTerm('');
    setFilterActive('all');
    setFilterBloqueado('all');
    setFilterDepartamento('all');
    setFilterRol('all');
    setSortBy('nombre');
    setSortOrder('asc');
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Obtener nombre del departamento
  const getDepartamentoNombre = (departamentoid) => {
    const depto = departamentos.find(d => d.departamentoid === departamentoid);
    return depto ? depto.nombre : 'Desconocido';
  };

  // Obtener nombre del rol
  const getRolNombre = (rolid) => {
    const rol = roles.find(r => r.rolid === rolid);
    return rol ? rol.nombre : 'Desconocido';
  };

  // Obtener icono según el rol
  const getRolIcon = (rolid) => {
    const rol = roles.find(r => r.rolid === rolid);
    if (!rol) return <SecurityIcon />;
    
    const nombre = rol.nombre?.toLowerCase() || '';
    if (nombre.includes('admin')) return <AdminIcon />;
    if (nombre.includes('supervisor')) return <SupervisorIcon />;
    if (nombre.includes('usuario')) return <PersonIcon />;
    if (nombre.includes('consulta')) return <VisibilityIcon />;
    return <SecurityIcon />;
  };

  // Obtener color según estado
  const getEstadoColor = (activo, bloqueado) => {
    if (bloqueado) return 'error';
    if (!activo) return 'warning';
    return 'success';
  };

  // Generar avatar con iniciales
  const getAvatarInitials = (nombre, apellido) => {
    return `${(nombre || '?').charAt(0)}${(apellido || '?').charAt(0)}`.toUpperCase();
  };

  // Obtener color para avatar
  const getAvatarColor = (nombre) => {
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1'];
    const index = (nombre?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  // Estadísticas
  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo === true).length,
    inactivos: usuarios.filter(u => u.activo === false).length,
    bloqueados: usuarios.filter(u => u.bloqueado === true).length,
    conIntentosFallidos: usuarios.filter(u => (u.intentosfallidos || 0) > 0).length
  };

  // Datos paginados del lado del cliente para la vista actual
  const paginatedUsuarios = filteredUsuarios.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Vista de tarjetas
  const renderCardView = () => (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {paginatedUsuarios.map((usuario) => {
        const avatarColor = getAvatarColor(usuario.nombre);
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={usuario.usuarioid}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                opacity: usuario.activo ? 1 : 0.7,
                border: usuario.bloqueado ? '2px solid' : 'none',
                borderColor: usuario.bloqueado ? 'error.main' : 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                {/* Badge de estado */}
                <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {usuario.bloqueado && (
                    <Chip
                      size="small"
                      label="BLOQUEADO"
                      color="error"
                      icon={<BlockIcon />}
                      variant="filled"
                    />
                  )}
                  {(usuario.intentosfallidos || 0) > 0 && (
                    <Chip
                      size="small"
                      label={`${usuario.intentosfallidos} intentos`}
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                {/* Avatar y nombre */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Box sx={{ bgcolor: getEstadoColor(usuario.activo, usuario.bloqueado), borderRadius: '50%', p: 0.5 }}>
                        {usuario.activo ? <CheckCircleIcon sx={{ fontSize: 12, color: 'white' }} /> : <CancelIcon sx={{ fontSize: 12, color: 'white' }} />}
                      </Box>
                    }
                  >
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: avatarColor,
                        fontSize: 24,
                        mb: 2
                      }}
                    >
                      {getAvatarInitials(usuario.nombre, usuario.apellido)}
                    </Avatar>
                  </Badge>
                  
                  <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {usuario.nombre} {usuario.apellido}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                    @{usuario.nombreusuario}
                  </Typography>
                </Box>
                
                {/* Información de contacto */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {usuario.email}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {getDepartamentoNombre(usuario.departamentoid)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getRolIcon(usuario.rolid)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {getRolNombre(usuario.rolid)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Información adicional */}
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        ID
                      </Typography>
                      <Typography variant="body2">
                        #{usuario.usuarioid}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Creado
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(usuario.fechacreacion).split(' ')[0]}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
              
              {/* Acciones */}
              <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between' }}>
                <Tooltip title="Ver detalles">
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => handleOpenDetailsDialog(usuario)}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Box>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEditDialog(usuario)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={usuario.activo ? 'Desactivar' : 'Activar'}>
                    <IconButton
                      size="small"
                      color={usuario.activo ? 'warning' : 'success'}
                      onClick={() => handleToggleStatus(usuario)}
                    >
                      {usuario.activo ? <PersonRemoveIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  
                  {usuario.bloqueado ? (
                    <Tooltip title="Desbloquear">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleOpenUnlockDialog(usuario)}
                      >
                        <LockOpenIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Resetear contraseña">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleOpenResetPasswordDialog(usuario)}
                      >
                        <LockResetIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  <Tooltip title="Eliminar">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleConfirmDelete(usuario)}
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
            <TableCell>Usuario</TableCell>
            <TableCell>Información</TableCell>
            <TableCell>Departamento</TableCell>
            <TableCell>Rol</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Último Acceso</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedUsuarios.map((usuario) => {
            const avatarColor = getAvatarColor(usuario.nombre);
            return (
              <TableRow 
                key={usuario.usuarioid} 
                hover
                sx={{ 
                  '&:hover': { 
                    backgroundColor: alpha('#000', 0.04) 
                  },
                  opacity: usuario.activo ? 1 : 0.7,
                  bgcolor: usuario.bloqueado ? alpha('#f44336', 0.05) : 'inherit'
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: avatarColor,
                        mr: 2
                      }}
                    >
                      {getAvatarInitials(usuario.nombre, usuario.apellido)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight="medium">
                        {usuario.nombre} {usuario.apellido}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{usuario.nombreusuario}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                      {usuario.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: #{usuario.usuarioid}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getDepartamentoNombre(usuario.departamentoid)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getRolIcon(usuario.rolid)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {getRolNombre(usuario.rolid)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Chip
                      icon={usuario.activo ? <CheckCircleIcon /> : <CancelIcon />}
                      label={usuario.activo ? 'Activo' : 'Inactivo'}
                      color={usuario.activo ? 'success' : 'error'}
                      size="small"
                      sx={{ mb: 0.5 }}
                    />
                    {usuario.bloqueado && (
                      <Chip
                        icon={<BlockIcon />}
                        label="Bloqueado"
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {(usuario.intentosfallidos || 0) > 0 && (
                      <Typography variant="caption" color="warning.main" display="block">
                        {usuario.intentosfallidos} intentos fallidos
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(usuario.ultimoacceso)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Creado: {formatDate(usuario.fechacreacion).split(' ')[0]}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        color="info"
                        onClick={() => handleOpenDetailsDialog(usuario)}
                        size="small"
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Editar">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(usuario)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {usuario.bloqueado ? (
                      <Tooltip title="Desbloquear">
                        <IconButton
                          color="success"
                          onClick={() => handleOpenUnlockDialog(usuario)}
                          size="small"
                        >
                          <LockOpenIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Resetear contraseña">
                        <IconButton
                          color="secondary"
                          onClick={() => handleOpenResetPasswordDialog(usuario)}
                          size="small"
                        >
                          <LockResetIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Eliminar">
                      <IconButton
                        color="error"
                        onClick={() => handleConfirmDelete(usuario)}
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
            Gestión de Usuarios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra los usuarios del sistema ({usuarios.length} usuarios cargados)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAllUsuarios}
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
            Nuevo Usuario
          </Button>
        </Box>
      </Box>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: 'success.light', color: 'white' }}>
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
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: 'warning.light', color: 'white' }}>
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
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: 'error.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BlockIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Bloqueados</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.bloqueados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 2, boxShadow: 3, bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Con Intentos</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {stats.conIntentosFallidos}
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
              label="Buscar usuarios"
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
              placeholder="Buscar por nombre, apellido, email o usuario..."
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Grid container spacing={1}>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filterActive}
                    label="Estado"
                    onChange={(e) => setFilterActive(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Activos</MenuItem>
                    <MenuItem value="inactive">Inactivos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Bloqueo</InputLabel>
                  <Select
                    value={filterBloqueado}
                    label="Bloqueo"
                    onChange={(e) => setFilterBloqueado(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="blocked">Bloqueados</MenuItem>
                    <MenuItem value="unblocked">No bloqueados</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    value={filterDepartamento}
                    label="Departamento"
                    onChange={(e) => setFilterDepartamento(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {departamentos.map((depto) => (
                      <MenuItem key={depto.departamentoid} value={depto.departamentoid}>
                        {depto.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={filterRol}
                    label="Rol"
                    onChange={(e) => setFilterRol(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {roles.map((rol) => (
                      <MenuItem key={rol.rolid} value={rol.rolid}>
                        {rol.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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
                  variant={sortBy === 'fechacreacion' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('fechacreacion')}
                  size="small"
                >
                  Ordenar por Fecha
                </Button>
                <IconButton
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  size="small"
                >
                  {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
                </IconButton>
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
            icon={<AssignmentIndIcon />} 
            label="Vista de Tarjetas" 
            iconPosition="start"
          />
          <Tab 
            icon={<PersonIcon />} 
            label="Vista de Tabla" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Contenido principal */}
      <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: 2, p: tabValue === 0 ? 3 : 0 }}>
        {loading || loadingRelated ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" variant="h6" gutterBottom>
              Error al cargar usuarios
            </Typography>
            <Typography color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchAllUsuarios}
              startIcon={<RefreshIcon />}
            >
              Reintentar
            </Button>
          </Box>
        ) : (
          <>
            {tabValue === 0 ? renderCardView() : renderTableView()}
            
            {/* Paginación del lado del cliente */}
            {filteredUsuarios.length > 0 && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Grid container alignItems="center" justifyContent="space-between">
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">
                      Mostrando {paginatedUsuarios.length} de {filteredUsuarios.length} usuarios filtrados
                      {filteredUsuarios.length !== usuarios.length && ` (de ${usuarios.length} totales)`}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50, 100]}
                      component="div"
                      count={filteredUsuarios.length}
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

      {/* Diálogo para crear/editar usuario */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6">
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                label="Nombre *"
                value={usuarioActual.nombre || ''}
                onChange={handleInputChange}
                size="small"
                required
                autoFocus
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="apellido"
                label="Apellido *"
                value={usuarioActual.apellido || ''}
                onChange={handleInputChange}
                size="small"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="email"
                label="Email *"
                type="email"
                value={usuarioActual.email || ''}
                onChange={handleInputChange}
                size="small"
                required
                helperText="Ingrese un email válido"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="nombreusuario"
                label="Nombre de Usuario *"
                value={usuarioActual.nombreusuario || ''}
                onChange={handleInputChange}
                size="small"
                required
                helperText="Nombre único para iniciar sesión"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="passwordhash" // Cambiado de 'password' a 'passwordhash'
                label={isEditing ? "Nueva Contraseña (dejar en blanco para mantener)" : "Contraseña *"}
                type={showPassword ? "text" : "password"}
                value={usuarioActual.passwordhash || ''}
                onChange={handleInputChange}
                size="small"
                required={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText={isEditing ? "Complete solo si desea cambiar la contraseña" : "Mínimo 8 caracteres"}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Departamento *</InputLabel>
                <Select
                  name="departamentoid"
                  value={usuarioActual.departamentoid || ''}
                  onChange={handleInputChange}
                  label="Departamento *"
                >
                  {departamentos.map((depto) => (
                    <MenuItem key={depto.departamentoid} value={depto.departamentoid}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" />
                        <Box>
                          <Typography>{depto.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {depto.activo ? 'Activo' : 'Inactivo'}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Rol *</InputLabel>
                <Select
                  name="rolid"
                  value={usuarioActual.rolid || ''}
                  onChange={handleInputChange}
                  label="Rol *"
                >
                  {roles.map((rol) => (
                    <MenuItem key={rol.rolid} value={rol.rolid}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getRolIcon(rol.rolid)}
                        <Box>
                          <Typography>{rol.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Nivel {rol.nivelacceso} - {rol.descripcion}
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
                    checked={usuarioActual.activo === true}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Usuario Activo"
                sx={{ mt: 1 }}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                Los usuarios inactivos no podrán iniciar sesión en el sistema
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUsuario}
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
            <Typography variant="h6">Detalles del Usuario</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {usuarioSeleccionado && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: getAvatarColor(usuarioSeleccionado.nombre),
                        fontSize: 24,
                        mr: 3
                      }}
                    >
                      {getAvatarInitials(usuarioSeleccionado.nombre, usuarioSeleccionado.apellido)}
                    </Avatar>
                    <Box>
                      <Typography variant="h4" gutterBottom>
                        {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={`@${usuarioSeleccionado.nombreusuario}`}
                          color="primary"
                          variant="outlined"
                          icon={<BadgeIcon />}
                        />
                        <Chip
                          label={usuarioSeleccionado.activo ? 'ACTIVO' : 'INACTIVO'}
                          color={usuarioSeleccionado.activo ? 'success' : 'error'}
                          icon={usuarioSeleccionado.activo ? <CheckCircleIcon /> : <CancelIcon />}
                        />
                        {usuarioSeleccionado.bloqueado && (
                          <Chip
                            label="BLOQUEADO"
                            color="error"
                            icon={<BlockIcon />}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    INFORMACIÓN PERSONAL
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <List dense>
                      <ListItem>
                        <ListItemAvatar>
                          <EmailIcon color="action" />
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Email" 
                          secondary={usuarioSeleccionado.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <BadgeIcon color="action" />
                        </ListItemAvatar>
                        <ListItemText 
                          primary="ID de Usuario" 
                          secondary={`#${usuarioSeleccionado.usuarioid}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <CalendarIcon color="action" />
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Fecha de Creación" 
                          secondary={formatDate(usuarioSeleccionado.fechacreacion)}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    INFORMACIÓN DEL SISTEMA
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <List dense>
                      <ListItem>
                        <ListItemAvatar>
                          <BusinessIcon color="action" />
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Departamento" 
                          secondary={getDepartamentoNombre(usuarioSeleccionado.departamentoid)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          {getRolIcon(usuarioSeleccionado.rolid)}
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Rol" 
                          secondary={getRolNombre(usuarioSeleccionado.rolid)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemAvatar>
                          <AccessTimeIcon color="action" />
                        </ListItemAvatar>
                        <ListItemText 
                          primary="Último Acceso" 
                          secondary={formatDate(usuarioSeleccionado.ultimoacceso)}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    SEGURIDAD
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Intentos Fallidos
                          </Typography>
                          <Typography variant="h4" color={(usuarioSeleccionado.intentosfallidos || 0) > 0 ? 'warning.main' : 'success.main'}>
                            {usuarioSeleccionado.intentosfallidos || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Estado de Bloqueo
                          </Typography>
                          <Typography variant="h6" color={usuarioSeleccionado.bloqueado ? 'error.main' : 'success.main'}>
                            {usuarioSeleccionado.bloqueado ? 'BLOQUEADO' : 'NO BLOQUEADO'}
                          </Typography>
                          {usuarioSeleccionado.fechabloqueo && (
                            <Typography variant="caption" color="text.secondary">
                              Desde: {formatDate(usuarioSeleccionado.fechabloqueo)}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Hash de Contraseña
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {usuarioSeleccionado.passwordhash?.substring(0, 20) || 'N/A'}...
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
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
          {usuarioAEliminar && (
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
                          width: 40,
                          height: 40,
                          bgcolor: getAvatarColor(usuarioAEliminar.nombre),
                          mr: 2
                        }}
                      >
                        {getAvatarInitials(usuarioAEliminar.nombre, usuarioAEliminar.apellido)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {usuarioAEliminar.nombre} {usuarioAEliminar.apellido}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{usuarioAEliminar.nombreusuario}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email:
                    </Typography>
                    <Typography variant="body1">
                      {usuarioAEliminar.email}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Departamento:
                    </Typography>
                    <Typography variant="body1">
                      {getDepartamentoNombre(usuarioAEliminar.departamentoid)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Rol:
                    </Typography>
                    <Typography variant="body1">
                      {getRolNombre(usuarioAEliminar.rolid)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Estado:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        size="small"
                        label={usuarioAEliminar.activo ? 'Activo' : 'Inactivo'}
                        color={usuarioAEliminar.activo ? 'success' : 'error'}
                      />
                      {usuarioAEliminar.bloqueado && (
                        <Chip
                          size="small"
                          label="Bloqueado"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Creado el:
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(usuarioAEliminar.fechacreacion)}
                    </Typography>
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
            onClick={handleDeleteUsuario}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Eliminar Definitivamente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para resetear contraseña */}
      <Dialog
        open={openResetPasswordDialog}
        onClose={handleCloseResetPasswordDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockResetIcon color="secondary" />
            <Typography variant="h6">Resetear Contraseña</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {usuarioParaReset && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Se generará una nueva contraseña aleatoria para el usuario
              </Alert>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={3}>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: getAvatarColor(usuarioParaReset.nombre)
                      }}
                    >
                      {getAvatarInitials(usuarioParaReset.nombre, usuarioParaReset.apellido)}
                    </Avatar>
                  </Grid>
                  <Grid item xs={9}>
                    <Typography variant="h6">
                      {usuarioParaReset.nombre} {usuarioParaReset.apellido}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{usuarioParaReset.nombreusuario}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      Se generará una contraseña aleatoria segura
                      <br />
                      <small>El usuario deberá cambiarla en su primer inicio de sesión</small>
                    </Alert>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseResetPasswordDialog} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            color="secondary"
            startIcon={<LockResetIcon />}
          >
            Resetear Contraseña
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para desbloquear usuario */}
      <Dialog
        open={openUnlockDialog}
        onClose={handleCloseUnlockDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockOpenIcon color="success" />
            <Typography variant="h6">Desbloquear Usuario</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {usuarioParaDesbloquear && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Se desbloqueará el usuario y se resetearán los intentos fallidos
              </Alert>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={3}>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: getAvatarColor(usuarioParaDesbloquear.nombre)
                      }}
                    >
                      {getAvatarInitials(usuarioParaDesbloquear.nombre, usuarioParaDesbloquear.apellido)}
                    </Avatar>
                  </Grid>
                  <Grid item xs={9}>
                    <Typography variant="h6">
                      {usuarioParaDesbloquear.nombre} {usuarioParaDesbloquear.apellido}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      @{usuarioParaDesbloquear.nombreusuario}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Intentos Fallidos:
                        </Typography>
                        <Typography variant="h5" color="error">
                          {usuarioParaDesbloquear.intentosfallidos || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Bloqueado desde:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(usuarioParaDesbloquear.fechabloqueo) || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseUnlockDialog} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleUnlockUser}
            variant="contained"
            color="success"
            startIcon={<LockOpenIcon />}
          >
            Desbloquear Usuario
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
              Información del Sistema - Usuarios
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              • Total de usuarios cargados: {usuarios.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Usuarios activos: {stats.activos} ({usuarios.length > 0 ? Math.round((stats.activos / usuarios.length) * 100) : 0}%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Usuarios inactivos: {stats.inactivos} ({usuarios.length > 0 ? Math.round((stats.inactivos / usuarios.length) * 100) : 0}%)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Usuarios bloqueados: {stats.bloqueados} ({usuarios.length > 0 ? Math.round((stats.bloqueados / usuarios.length) * 100) : 0}%)
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              • Mostrando {paginatedUsuarios.length} de {filteredUsuarios.length} usuarios filtrados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Departamentos cargados: {departamentos.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Roles cargados: {roles.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Última actualización: {new Date().toLocaleString('es-ES')}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default UsuariosCRUD;