import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Snackbar,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Shield as SecurityIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';

const API_BASE = 'http://localhost:8000/api';

const AdminPanel = () => {
  const [stats, setStats] = useState({
    total_roles: 0,
    total_pantallas: 0,
    total_asignaciones: 0,
    pantallas_activas: 0,
    roles_activos: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Verificar si el usuario es administrador (RolID = 1)
  const checkAdminAccess = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.rol_id === 1 || user.rol === 'Administrador';
  };

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Obtener roles
      const rolesResponse = await fetch(`${API_BASE}/roles/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const rolesData = await rolesResponse.json();
      
      // Obtener pantallas
      const pantallasResponse = await fetch(`${API_BASE}/pantallas/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const pantallasData = await pantallasResponse.json();
      
      // Obtener asignaciones
      const asignacionesResponse = await fetch(`${API_BASE}/rolpantallas/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      const asignacionesData = await asignacionesResponse.json();

      if (rolesResponse.ok && pantallasResponse.ok && asignacionesResponse.ok) {
        const roles = rolesData.results || rolesData;
        const pantallas = pantallasData.results || pantallasData;
        const asignaciones = asignacionesData.results || asignacionesData;

        setStats({
          total_roles: roles.length,
          total_pantallas: pantallas.length,
          total_asignaciones: asignaciones.length,
          pantallas_activas: pantallas.filter(p => p.activo).length,
          roles_activos: roles.filter(r => r.activo).length,
        });

        // Simular actividad reciente (en producción, esto vendría del backend)
        setRecentActivity([
          {
            id: 1,
            action: 'Nueva asignación',
            description: 'Rol "Operador" asignado a pantalla "Dashboard"',
            timestamp: 'Hace 5 minutos',
            type: 'assignment',
          },
          {
            id: 2,
            action: 'Rol creado',
            description: 'Nuevo rol "Supervisor" creado',
            timestamp: 'Hace 1 hora',
            type: 'role',
          },
          {
            id: 3,
            action: 'Pantalla actualizada',
            description: 'Pantalla "Reportes" modificada',
            timestamp: 'Hace 2 horas',
            type: 'screen',
          },
          {
            id: 4,
            action: 'Permisos modificados',
            description: 'Se actualizaron permisos del rol "Administrador"',
            timestamp: 'Hace 3 horas',
            type: 'permission',
          },
        ]);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error cargando estadísticas',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checkAdminAccess()) {
      setSnackbar({
        open: true,
        message: 'No tienes permisos de administrador para acceder a esta página',
        severity: 'error',
      });
      return;
    }

    fetchStats();
  }, []);

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Obtener icono según tipo de actividad
  const getActivityIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <AssignmentIcon color="primary" />;
      case 'role':
        return <PeopleIcon color="success" />;
      case 'screen':
        return <VisibilityIcon color="info" />;
      case 'permission':
        return <LockIcon color="warning" />;
      default:
        return <SettingsIcon />;
    }
  };

  if (!checkAdminAccess()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography>
            No tienes los permisos necesarios para acceder al panel de administración.
            Esta página está restringida para usuarios con rol de Administrador (RolID = 1).
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1">
              Panel de Administración RBAC
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de Roles, Pantallas y Permisos del Sistema
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchStats}
          disabled={loading}
        >
          Refrescar
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Tarjetas de Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Roles Totales
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_roles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.roles_activos} activos
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pantallas
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_pantallas}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats.pantallas_activas} activas
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <VisibilityIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Asignaciones
                  </Typography>
                  <Typography variant="h4">
                    {stats.total_asignaciones}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Permisos totales
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Estado Sistema
                  </Typography>
                  <Typography variant="h4">
                    <TrendingUpIcon color="success" />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Operativo
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <SecurityIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Acciones Rápidas */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Acciones Rápidas de Administración
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PeopleIcon />}
                  href="/roles-admin"
                  sx={{ py: 2 }}
                >
                  Gestionar Roles
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  color="info"
                  fullWidth
                  startIcon={<VisibilityIcon />}
                  href="/pantallas-admin"
                  sx={{ py: 2 }}
                >
                  Gestionar Pantallas
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<AssignmentIcon />}
                  href="/rolpantallas-admin"
                  sx={{ py: 2 }}
                >
                  Asignar Permisos
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<LockIcon />}
                  href="/verificacion-acceso"
                  sx={{ py: 2 }}
                >
                  Verificar Acceso
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  color="info"
                  fullWidth
                  startIcon={<DashboardIcon />}
                  href="/dashboard"
                  sx={{ py: 2 }}
                >
                  Dashboard Principal
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="outlined"
                  color="warning"
                  fullWidth
                  startIcon={<SettingsIcon />}
                  href="/configuracion"
                  sx={{ py: 2 }}
                >
                  Configuración
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Actividad Reciente */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actividad Reciente
            </Typography>
            <List dense>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.action}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.timestamp}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Información del Sistema */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información del Sistema RBAC
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Características Principales
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Control de acceso basado en roles (RBAC)" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Gestión jerárquica de roles" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Asignación granular de permisos" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Verificación en tiempo real de acceso" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Estado de Componentes
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="API de Roles: Operativa" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="API de Pantallas: Operativa" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="API de Asignaciones: Operativa" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Verificación de Acceso: Activa" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Paper>

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

export default AdminPanel;
