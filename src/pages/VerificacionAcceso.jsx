import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOff,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';

const API_BASE = 'http://localhost:8000/api';

const VerificacionAcceso = () => {
  const [roles, setRoles] = useState([]);
  const [pantallas, setPantallas] = useState([]);
  const [selectedRol, setSelectedRol] = useState('');
  const [selectedPantalla, setSelectedPantalla] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [rolPermissions, setRolPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

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
    fetchRoles();
    fetchPantallas();
  }, []);

  // Verificar acceso específico
  const handleVerifyAccess = async () => {
    if (!selectedRol || !selectedPantalla) {
      setSnackbar({
        open: true,
        message: 'Por favor seleccione un rol y una pantalla',
        severity: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/verificar-acceso/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          rol_id: selectedRol,
          pantalla_codigo: selectedPantalla,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationResult({
          tiene_acceso: data.tiene_acceso,
          rol: roles.find(r => r.id === selectedRol)?.nombre,
          pantalla: pantallas.find(p => p.codigo === selectedPantalla)?.nombre,
          codigo: selectedPantalla,
        });
      } else {
        throw new Error(data.error || 'Error verificando acceso');
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

  // Obtener permisos del rol
  const handleGetRolPermissions = async () => {
    if (!selectedRol) {
      setSnackbar({
        open: true,
        message: 'Por favor seleccione un rol',
        severity: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/rolpantallas/?rol=${selectedRol}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setRolPermissions(data.results || data);
      } else {
        throw new Error('Error obteniendo permisos del rol');
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

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Obtener pantallas por módulo
  const getPantallasByModulo = () => {
    return pantallas.reduce((acc, pantalla) => {
      if (!acc[pantalla.modulo]) {
        acc[pantalla.modulo] = [];
      }
      acc[pantalla.modulo].push(pantalla);
      return acc;
    }, {});
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

  const pantallasByModulo = getPantallasByModulo();

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Verificación de Acceso por Rol
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchRoles();
            fetchPantallas();
            setVerificationResult(null);
            setRolPermissions([]);
          }}
        >
          Refrescar Datos
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Panel de Control */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Verificación de Acceso
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Seleccionar Rol</InputLabel>
                <Select
                  value={selectedRol}
                  onChange={(e) => {
                    setSelectedRol(e.target.value);
                    setVerificationResult(null);
                    setRolPermissions([]);
                  }}
                  label="Seleccionar Rol"
                >
                  {roles.map((rol) => (
                    <MenuItem key={rol.id} value={rol.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShieldIcon color="primary" />
                        <Box>
                          <Typography variant="body2">{rol.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getNivelAccesoText(rol.nivel_acceso)}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Seleccionar Pantalla</InputLabel>
                <Select
                  value={selectedPantalla}
                  onChange={(e) => setSelectedPantalla(e.target.value)}
                  label="Seleccionar Pantalla"
                >
                  {Object.entries(pantallasByModulo).map(([modulo, pantallasModulo]) => (
                    <Box key={modulo} sx={{ py: 1 }}>
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ pl: 2, fontWeight: 'bold', textTransform: 'uppercase' }}
                      >
                        {modulo}
                      </Typography>
                      {pantallasModulo.map((pantalla) => (
                        <MenuItem key={pantalla.id} value={pantalla.codigo}>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2">{pantalla.nombre}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pantalla.codigo}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Box>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleVerifyAccess}
                  disabled={loading || !selectedRol || !selectedPantalla}
                  startIcon={<SearchIcon />}
                  fullWidth
                >
                  Verificar Acceso
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGetRolPermissions}
                  disabled={loading || !selectedRol}
                  startIcon={<VisibilityIcon />}
                  fullWidth
                >
                  Ver Permisos
                </Button>
              </Box>
            </Box>

            {loading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
              </Box>
            )}

            {/* Resultado de Verificación */}
            {verificationResult && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resultado de Verificación
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {verificationResult.tiene_acceso ? (
                      <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                    ) : (
                      <CancelIcon color="error" sx={{ fontSize: 40 }} />
                    )}
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {verificationResult.tiene_acceso ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rol: {verificationResult.rol}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pantalla: {verificationResult.pantalla}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={verificationResult.tiene_acceso ? 'Permitido' : 'Denegado'}
                    color={verificationResult.tiene_acceso ? 'success' : 'error'}
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>

        {/* Panel de Permisos del Rol */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Permisos del Rol
                {selectedRol && (
                  <Badge badgeContent={rolPermissions.length} color="primary" sx={{ ml: 2 }}>
                    <Chip label="Asignadas" size="small" />
                  </Badge>
                )}
              </Typography>
            </Box>

            {selectedRol ? (
              <Box>
                {rolPermissions.length > 0 ? (
                  <List dense>
                    {rolPermissions.map((permiso, index) => (
                      <React.Fragment key={permiso.id}>
                        <ListItem>
                          <ListItemIcon>
                            {permiso.pantalla_activo ? (
                              <LockOpenIcon color="success" />
                            ) : (
                              <LockIcon color="disabled" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={permiso.pantalla_nombre}
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {permiso.pantalla_codigo}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    label={permiso.pantalla_modulo}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={permiso.pantalla_activo ? 'Activa' : 'Inactiva'}
                                    size="small"
                                    color={permiso.pantalla_activo ? 'success' : 'error'}
                                  />
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < rolPermissions.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ShieldIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {loading ? 'Cargando permisos...' : 'Este rol no tiene permisos asignados'}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ShieldIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Seleccione un rol para ver sus permisos
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Resumen General */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumen General del Sistema
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <ShieldIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4">{roles.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Roles Totales
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <VisibilityIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4">{pantallas.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pantallas Totales
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4">
                      {pantallas.filter(p => p.activo).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pantallas Activas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <LockIcon color="warning" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h4">
                      {selectedRol ? rolPermissions.length : '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Permisos del Rol
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

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

export default VerificacionAcceso;
