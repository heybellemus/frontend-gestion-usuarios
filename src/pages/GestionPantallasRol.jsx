import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Grid, List, ListItem, ListItemButton, ListItemText,
  ListItemIcon, Checkbox, Button, TextField, Divider, Chip, Card,
  CardContent, CircularProgress, Snackbar, Alert, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  InputAdornment, Tabs, Tab, Stack, Skeleton, Fade,
  useMediaQuery, useTheme, IconButton, Tooltip, AlertTitle
} from '@mui/material';
import {
  Security, Smartphone, Computer, Search, Save, Refresh,
  AdminPanelSettings, ArrowForwardIos, Dashboard,
  Cancel, Info, Close as CloseIcon, CheckCircle, Warning,
  CloudDone, Memory, Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { permissionsService } from '../services/permissionsService';

const API_BASE_URL = 'http://127.0.0.1:8000';
const ENDPOINTS = {
  misPantallas: `${API_BASE_URL}/pantallas-usuario/`,
  todasPantallas: `${API_BASE_URL}/pantallas-list/`,
  rolPantallas: (id) => `${API_BASE_URL}/rol-pantallas/${id}/`,
  asignarPantalla: `${API_BASE_URL}/asignar-pantalla-rol/`,
  roles: `${API_BASE_URL}/api/roles/`,
};

const GestionPantallasRol = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  const token = localStorage.getItem('authToken');

  // Estados
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    roles: false,
    pantallas: false,
    misPantallas: false,
    permisos: false
  });
  const [error, setError] = useState(null);
  
  const [roles, setRoles] = useState([]);
  const [pantallas, setPantallas] = useState([]);
  const [misPantallas, setMisPantallas] = useState([]);
  
  const [selectedRol, setSelectedRol] = useState(null);
  const [permisosActuales, setPermisosActuales] = useState({}); 
  const [cambiosPendientes, setCambiosPendientes] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const getPantallaId = (item) => {
    if (!item || typeof item !== 'object') return null;
    return (
      item.pantalla_id ??
      item.pantallaid ??
      item.pantalla?.id ??
      item.pantalla?.pantallaid ??
      item.id ??
      null
    );
  };

  const getHeaders = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    // Validar formato básico del token JWT
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token inválido: formato incorrecto');
      }
      
      // Verificar si el token está expirado
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        localStorage.removeItem('authToken');
        throw new Error('Token expirado. Por favor, inicia sesión nuevamente.');
      }
    } catch (e) {
      if (e.message.includes('expirado')) {
        throw e;
      }
      console.warn('No se pudo validar el token:', e.message);
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Función para manejar errores de fetch
  const handleFetchResponse = async (response) => {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || errorData.error || `Error ${response.status}`;
      } catch {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  };

  // Carga de roles
  const fetchRoles = async () => {
    setLoadingStates(prev => ({ ...prev, roles: true }));
    setError(null);
    
    try {
      console.log('Fetching roles from:', ENDPOINTS.roles);
      console.log('With token:', token);
      
      const response = await fetch(ENDPOINTS.roles, { 
        headers: getHeaders() 
      });
      
      const data = await handleFetchResponse(response);
      console.log('Roles response:', data);
      
      // Manejar diferentes formatos de respuesta
      let rolesData = [];
      if (Array.isArray(data)) {
        rolesData = data;
      } else if (data.results && Array.isArray(data.results)) {
        rolesData = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        rolesData = data.data;
      }
      
      setRoles(rolesData);
      
      // Auto-seleccionar el primer rol
      if (rolesData.length > 0 && !selectedRol) {
        console.log('Auto-seleccionando rol:', rolesData[0]);
        setSelectedRol(rolesData[0]);
      }
      
    } catch (e) {
      console.error("Error detallado:", e);
      
      // Si el token está expirado, cerrar sesión y redirigir
      if (e.message.includes('expirado') || e.message.includes('No hay token')) {
        logout();
        navigate('/login');
        return;
      }
      
      setError(`Error al cargar roles: ${e.message}`);
      setSnackbar({
        open: true,
        message: `Error: ${e.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, roles: false }));
    }
  };

  // Carga de todas las pantallas
  const fetchTodasPantallas = async () => {
    setLoadingStates(prev => ({ ...prev, pantallas: true }));
    
    try {
      console.log('Fetching pantallas from:', ENDPOINTS.todasPantallas);
      
      const response = await fetch(ENDPOINTS.todasPantallas, { 
        headers: getHeaders() 
      });
      
      const data = await handleFetchResponse(response);
      console.log('Pantallas response:', data);
      
      let pantallasData = [];
      if (Array.isArray(data)) {
        pantallasData = data;
      } else if (data.results && Array.isArray(data.results)) {
        pantallasData = data.results;
      } else if (data.pantallas && Array.isArray(data.pantallas)) {
        pantallasData = data.pantallas;
      } else if (data.data && Array.isArray(data.data)) {
        pantallasData = data.data;
      }
      
      setPantallas(pantallasData);
      
    } catch (e) {
      console.error("Error pantallas:", e);
      setSnackbar({
        open: true,
        message: `Error al cargar pantallas: ${e.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, pantallas: false }));
    }
  };

  // Carga de pantallas de un rol específico
  const fetchPantallasPorRol = async (rolId) => {
    if (!rolId) return;
    
    setLoadingStates(prev => ({ ...prev, permisos: true }));
    
    try {
      const url = ENDPOINTS.rolPantallas(rolId);
      console.log('Fetching permisos from:', url);
      
      const response = await fetch(url, { 
        headers: getHeaders() 
      });
      
      const data = await handleFetchResponse(response);
      console.log('Permisos response:', data);
      
      const listaPermisos = Array.isArray(data)
        ? data
        : (data.results || data.pantallas || []);
      const mapping = {};
      
      listaPermisos.forEach(p => {
        // Determinar el ID correcto de la pantalla
        let pantallaId = getPantallaId(p);
        if (pantallaId === null || pantallaId === undefined) {
          const codigoPantalla = p.codigo || p.pantalla_codigo || p.pantalla?.codigo;
          if (codigoPantalla) {
            const pantallaMatch = pantallas.find(x => x.codigo === codigoPantalla);
            pantallaId = getPantallaId(pantallaMatch);
          }
        }
        if (pantallaId !== null && pantallaId !== undefined) {
          const acceso = (
            p.acceso ??
            p.tiene_acceso ??
            p.otorgado ??
            p.permitido ??
            true
          );
          mapping[String(pantallaId)] = Boolean(acceso);
        }
      });
      
      console.log('Permisos mapeados:', mapping);
      setPermisosActuales(mapping);
      
    } catch (e) {
      console.error("Error permisos:", e);
      setSnackbar({
        open: true,
        message: `Error al cargar permisos: ${e.message}`,
        severity: 'error'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, permisos: false }));
    }
  };

  // Carga inicial
  useEffect(() => {
    if (token) {
      console.log('Token presente, iniciando carga...');
      fetchRoles();
      fetchTodasPantallas();
    } else {
      setError('No hay token de autenticación');
    }
  }, [token]);

  // Cargar permisos cuando se selecciona un rol
  useEffect(() => {
    if (selectedRol) {
      const rolId = selectedRol.id || selectedRol.rolid;
      console.log('Rol seleccionado:', selectedRol, 'ID:', rolId);
      fetchPantallasPorRol(rolId);
    }
  }, [selectedRol]);

  useEffect(() => {
    if (selectedRol && Array.isArray(pantallas) && pantallas.length > 0) {
      const rolId = selectedRol.id || selectedRol.rolid;
      fetchPantallasPorRol(rolId);
    }
  }, [pantallas]);

  const handleSelectRol = (rol) => {
    console.log('Seleccionando rol:', rol);
    setSelectedRol(rol);
    setCambiosPendientes({});
  };

  // Filtrado de pantallas
  const pantallasFiltradas = useMemo(() => {
    if (!Array.isArray(pantallas) || pantallas.length === 0) {
      console.log('No hay pantallas para filtrar');
      return [];
    }
    
    if (!searchQuery) return pantallas;
    
    const searchLower = searchQuery.toLowerCase();
    return pantallas.filter(p => 
      (p.nombre?.toLowerCase() || '').includes(searchLower) || 
      (p.codigo?.toLowerCase() || '').includes(searchLower)
    );
  }, [pantallas, searchQuery]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    if (!selectedRol) return { asignadas: 0, total: pantallas.length };
    
    const asignadas = Object.values(permisosActuales).filter(v => v).length;
    return { asignadas, total: pantallas.length };
  }, [selectedRol, permisosActuales, pantallas]);

  const handleTogglePantalla = (pantallaId) => {
    if (pantallaId === null || pantallaId === undefined) return;

    console.log('Toggle pantalla:', pantallaId);
    console.log('Permisos actuales:', permisosActuales);
    console.log('Cambios pendientes antes:', cambiosPendientes);

    setCambiosPendientes(prev => {
      const idKey = String(pantallaId);
      const valorOriginal = !!permisosActuales[idKey];
      const nuevoEstado = !(Object.prototype.hasOwnProperty.call(prev, idKey) ? prev[idKey] : valorOriginal);
      
      console.log('idKey:', idKey, 'valorOriginal:', valorOriginal, 'nuevoEstado:', nuevoEstado);
      
      const updated = { ...prev, [idKey]: nuevoEstado };
      if (nuevoEstado === valorOriginal) {
        delete updated[idKey];
      }
      
      console.log('Cambios pendientes después:', updated);
      return updated;
    });
  };

  // Función actualizada para guardar cambios - CORREGIDA: cambiado rol_id por rolid
  const handleGuardarCambios = async () => {
    const idsParaCambiar = Object.keys(cambiosPendientes);
    if (idsParaCambiar.length === 0) return;

    setLoading(true);
    let exitos = 0;

    try {
      const rolId = Number.parseInt(String(selectedRol?.id || selectedRol?.rolid), 10);
      if (Number.isNaN(rolId)) {
        throw new Error('rol_id invalido');
      }

      // Enviar solo las pantallas modificadas para evitar reprocesar permisos ya existentes
      const pantallasData = idsParaCambiar
        .map((idKey) => {
          const pantallaId = Number.parseInt(idKey, 10);
          if (Number.isNaN(pantallaId)) return null;

          return {
            pantalla_id: pantallaId,
            acceso: !!cambiosPendientes[idKey]
          };
        })
        .filter(item => item !== null);

      console.log('Enviando datos al backend:', {
        rolid: rolId,  // CAMBIADO: ahora es 'rolid' en lugar de 'rol_id'
        pantallas: pantallasData
      });

      const response = await fetch(`${API_BASE_URL}/asignar-multiples-pantallas-rol/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          rolid: rolId,  // CAMBIADO: de rol_id a rolid
          pantallas: pantallasData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Respuesta del servidor:', errorText);
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const resultado = await response.json();
      console.log('Respuesta exitosa:', resultado);
      console.log('Estructura de respuesta:', Object.keys(resultado));
      console.log('Tipo de resultado:', typeof resultado);
      
      // Manejar diferentes formatos de respuesta del backend
      const exitosas = resultado.exitosas || resultado.success || resultado.count || resultado.length || idsParaCambiar.length;
      const fallidas = resultado.fallidas || resultado.failed || resultado.errors || 0;
      
      console.log('Exitosas calculadas:', exitosas, 'Fallidas calculadas:', fallidas);
      
      setSnackbar({
        open: true,
        message: `Guardados ${exitosas} de ${idsParaCambiar.length} cambios`,
        severity: fallidas === 0 ? 'success' : 'warning'
      });

      exitos = exitosas;

    } catch (e) {
      console.error('Error guardando:', e);
      setSnackbar({
        open: true,
        message: `Error al guardar: ${e.message}`,
        severity: 'error'
      });
    } finally {
      setCambiosPendientes({});
      if (exitos > 0) {
        permissionsService.clearPermissions();
        window.dispatchEvent(new Event('permissions-updated'));
      }
      if (selectedRol) {
        await fetchPantallasPorRol(selectedRol.id || selectedRol.rolid);
      }
      setLoading(false);
    }
  };

  // Función para sincronizar todos los permisos - CORREGIDA: cambiado rol_id por rolid
  const handleSincronizarTodos = async () => {
    if (!selectedRol) return;

    setLoading(true);
    
    try {
      const rolId = Number.parseInt(String(selectedRol?.id || selectedRol?.rolid), 10);
      
      // Crear array con TODAS las pantallas y su estado actual
      const pantallasDataCompleto = pantallas
        .map(p => {
          const pantallaId = getPantallaId(p);
          if (!pantallaId) return null;
          
          const idKey = String(pantallaId);
          const tieneAcceso = Object.prototype.hasOwnProperty.call(cambiosPendientes, idKey) 
            ? cambiosPendientes[idKey] 
            : !!permisosActuales[idKey];
          
          return {
            pantalla_id: Number.parseInt(idKey, 10),
            acceso: tieneAcceso
          };
        })
        .filter(item => item !== null);

      const response = await fetch(`${API_BASE_URL}/asignar-multiples-pantallas-rol/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          rolid: rolId,  // CAMBIADO: de rol_id a rolid
          pantallas: pantallasDataCompleto
        })
      });

      if (!response.ok) {
        throw new Error('Error al sincronizar');
      }

      const resultado = await response.json();
      
      setSnackbar({
        open: true,
        message: `Sincronización completada: ${resultado.exitosas} exitosas, ${resultado.fallidas} fallidas`,
        severity: resultado.fallidas === 0 ? 'success' : 'warning'
      });

      setCambiosPendientes({});
      await fetchPantallasPorRol(rolId);

    } catch (e) {
      console.error('Error sincronizando:', e);
      setSnackbar({
        open: true,
        message: `Error al sincronizar: ${e.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Si no hay token
  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error de autenticación</AlertTitle>
          No hay token de acceso. Por favor, inicia sesión nuevamente.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header con información del usuario */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5">Gestión de Pantallas por Rol</Typography>
          <Typography variant="body2" color="textSecondary">
            Usuario: {user?.username || 'Administrador'} | Token: {token ? '✓ Presente' : '✗ No encontrado'}
          </Typography>
        </Box>
        <Box>
          <Button 
            startIcon={<Refresh />} 
            onClick={() => {
              fetchRoles();
              fetchTodasPantallas();
            }}
            sx={{ mr: 1 }}
          >
            Recargar Datos
          </Button>
          {selectedRol && (
            <Button
              variant="outlined"
              startIcon={<CloudDone />}
              onClick={handleSincronizarTodos}
              disabled={loading}
            >
              Sincronizar Todos
            </Button>
          )}
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)} 
          variant={isMobile ? "scrollable" : "fullWidth"}
        >
          <Tab icon={<AdminPanelSettings />} label="GESTIÓN DE PERMISOS" />
          <Tab icon={<Dashboard />} label="MIS PANTALLAS" />
        </Tabs>
      </Paper>

      {tabValue === 0 ? (
        <Grid container spacing={3}>
          {/* Lista de Roles */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Roles Disponibles
                {loadingStates.roles && <CircularProgress size={20} sx={{ ml: 1 }} />}
              </Typography>
              
              {loadingStates.roles ? (
                <Stack spacing={1}>
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                </Stack>
              ) : roles.length > 0 ? (
                <List>
                  {roles.map((rol) => (
                    <ListItem 
                      key={rol.id || rol.rolid}
                      disablePadding
                      sx={{ mb: 1 }}
                    >
                      <ListItemButton
                        selected={selectedRol?.id === rol.id || selectedRol?.rolid === rol.rolid}
                        onClick={() => handleSelectRol(rol)}
                        sx={{ 
                          borderRadius: 1,
                          '&.Mui-selected': { 
                            bgcolor: 'primary.main', 
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            }
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Security sx={{ color: (selectedRol?.id === rol.id || selectedRol?.rolid === rol.rolid) ? 'white' : undefined }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={rol.nombre} 
                          secondary={rol.descripcion}
                          secondaryTypographyProps={{
                            sx: { color: (selectedRol?.id === rol.id || selectedRol?.rolid === rol.rolid) ? 'rgba(255,255,255,0.7)' : undefined }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">No hay roles disponibles</Alert>
              )}
            </Paper>
          </Grid>

          {/* Tabla de Pantallas */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '70vh', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">
                    {selectedRol ? selectedRol.nombre : 'Selecciona un rol'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Total: {estadisticas.total} | Asignadas: {estadisticas.asignadas} | 
                    Pendientes: {Object.keys(cambiosPendientes).length}
                  </Typography>
                </Box>
                <TextField 
                  size="small"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                  }}
                  sx={{ width: '250px' }}
                />
              </Box>

              {loadingStates.pantallas || loadingStates.permisos ? (
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer sx={{ flexGrow: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">Acceso</TableCell>
                        <TableCell>Pantalla</TableCell>
                        <TableCell>Código</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pantallasFiltradas.length > 0 ? (
                        pantallasFiltradas.map((p, index) => {
                          const id = getPantallaId(p);
                          const idKey = id !== null && id !== undefined ? String(id) : null;
                          const rowKey = idKey || `pantalla-${p.codigo || p.nombre || index}`;
                          const hasChanged = idKey ? Object.prototype.hasOwnProperty.call(cambiosPendientes, idKey) : false;
                          const isChecked = idKey ? (hasChanged ? cambiosPendientes[idKey] : !!permisosActuales[idKey]) : false;

                          return (
                            <TableRow 
                              key={rowKey}
                              sx={{ 
                                bgcolor: hasChanged ? 'action.hover' : 'inherit',
                                '&:hover': { bgcolor: 'action.selected' }
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox 
                                  checked={isChecked}
                                  disabled={!selectedRol || loading || !id}
                                  onChange={() => handleTogglePantalla(id)}
                                  color={hasChanged ? "warning" : "primary"}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {p.tipo === 'mobile' ? <Smartphone /> : <Computer />}
                                  {p.nombre}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip label={p.codigo} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                {hasChanged ? (
                                  <Chip 
                                    label="Pendiente" 
                                    size="small" 
                                    color="warning"
                                    icon={<Warning />}
                                  />
                                ) : isChecked ? (
                                  <Chip 
                                    label="Acceso" 
                                    size="small" 
                                    color="success"
                                    icon={<CheckCircle />}
                                  />
                                ) : (
                                  <Chip 
                                    label="Sin acceso" 
                                    size="small" 
                                    color="default"
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            <Info sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                            <Typography color="textSecondary">
                              {searchQuery ? 'No hay resultados para la búsqueda' : 'No hay pantallas disponibles'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {Object.keys(cambiosPendientes).length > 0 && (
                <Box sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button 
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => setCambiosPendientes({})}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleGuardarCambios}
                    disabled={loading}
                  >
                    Guardar Cambios ({Object.keys(cambiosPendientes).length})
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Panel de Resumen */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Resumen
              </Typography>
              {selectedRol ? (
                <Box>
                  <Typography variant="body2" paragraph>
                    <strong>Rol:</strong> {selectedRol.nombre}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Pantallas:</strong> {estadisticas.asignadas}/{estadisticas.total}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Progreso:</strong> {Math.min(100, Math.round((estadisticas.asignadas / Math.max(estadisticas.total, 1)) * 100))}%
                  </Typography>
                  <Box sx={{ 
                    width: '100%', 
                    bgcolor: 'grey.200', 
                    borderRadius: 1,
                    height: 8,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${Math.min(100, Math.round((estadisticas.asignadas / Math.max(estadisticas.total, 1)) * 100))}%`,
                      bgcolor: 'primary.main',
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                  {Object.keys(cambiosPendientes).length > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Tienes {Object.keys(cambiosPendientes).length} cambio(s) pendiente(s)
                    </Alert>
                  )}
                </Box>
              ) : (
                <Typography color="textSecondary">
                  Selecciona un rol para ver detalles
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Vista de Mis Pantallas
        <Grid container spacing={3}>
          {misPantallas.length > 0 ? (
            misPantallas.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{p.nombre}</Typography>
                    <Chip label={p.codigo} size="small" sx={{ mt: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">
                No tienes pantallas asignadas
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default GestionPantallasRol;