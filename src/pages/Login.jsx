// Login.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  Link,
  Grid,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  Email
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// URL de la API de login
const LOGIN_API_URL = 'http://localhost:8000/login/';
const RECOVERY_REQUEST_URL = 'http://localhost:8000/solicitar-recuperacion/';
const RECOVERY_CONFIRM_URL = 'http://localhost:8000/confirmar-recuperacion/';
const RECOVERY_VERIFY_URL = 'http://localhost:8000/verificar-token/';

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(0);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotInfo, setForgotInfo] = useState('');

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!credentials.username.trim()) {
      newErrors.username = 'El usuario o email es requerido';
    }
    
    if (!credentials.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (credentials.password.length < 4) {
      newErrors.password = 'La contraseña debe tener al menos 4 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      console.log('Enviando datos a:', LOGIN_API_URL);
      console.log('Datos:', credentials);
      
      // Formato correcto según backend (email/password)
      let requestBody = {
        email: credentials.username,
        password: credentials.password,
      };
      
      const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Respuesta completa:', data);
      
      if (response.ok) {
        // Login exitoso*
        console.log('Login exitoso, respuesta:', data);
        
        // Manejar diferentes formatos de respuesta
        let authToken = null;
        let userData = null;
        
        // Django REST Framework JWT
        if (data.access) {
          authToken = data.access;
          userData = {
            username: credentials.username,
            refresh: data.refresh || null
          };
        }
        // Token simple
        else if (data.token) {
          authToken = data.token;
          userData = data.user || { username: credentials.username };
        }
        // Respuesta personalizada
        else if (data.success && data.data) {
          authToken = data.data.token || data.data.access_token;
          userData = data.data.user || { username: credentials.username };
        }
        // Si no hay estructura clara, usar toda la respuesta
        else {
          authToken = JSON.stringify(data);
          userData = { username: credentials.username };
        }
        
        // Usar el hook de autenticación
        if (authToken) {
          login(authToken, userData);
        }
        
        // Mostrar mensaje de éxito
        setSnackbar({
          open: true,
          message: `¡Bienvenido(a) ${userData.username}!`,
          severity: 'success'
        });
        
        // Redirigir después de 1 segundo a la página solicitada o dashboard
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }, 1000);
        
      } else {
        // Manejar errores de la API
        console.error('Error en login:', data);
        
        // Manejar diferentes formatos de error
        let errorMessage = 'Credenciales incorrectas';
        
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = data.non_field_errors.join(', ');
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else if (Array.isArray(data)) {
          errorMessage = data.join(', ');
        } else if (typeof data === 'object') {
          // Si hay errores por campo
          const fieldErrors = Object.entries(data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
        
        // Mostrar error en snackbar
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
        
        // También marcar errores en los campos si es específico
        if (data.username) {
          setErrors(prev => ({
            ...prev,
            username: Array.isArray(data.username) ? data.username.join(', ') : data.username
          }));
        }
        
        if (data.password) {
          setErrors(prev => ({
            ...prev,
            password: Array.isArray(data.password) ? data.password.join(', ') : data.password
          }));
        }
      }
      
    } catch (err) {
      console.error('Error de conexión:', err);
      
      setSnackbar({
        open: true,
        message: `Error de conexión: ${err.message}. Verifica que el servidor esté corriendo en ${LOGIN_API_URL}`,
        severity: 'error'
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenForgot = () => {
    setForgotOpen(true);
    setForgotStep(0);
    setForgotLoading(false);
    setForgotEmail(credentials.username.includes('@') ? credentials.username : '');
    setForgotToken('');
    setForgotPassword('');
    setForgotConfirm('');
    setForgotErrors({});
    setForgotInfo('');
  };

  const handleCloseForgot = () => {
    if (forgotLoading) return;
    setForgotOpen(false);
  };

  const validateForgotEmail = () => {
    const newErrors = {};
    if (!forgotEmail.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      newErrors.email = 'Formato de email inválido';
    }
    setForgotErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotReset = () => {
    const newErrors = {};
    if (!forgotToken.trim()) {
      newErrors.token = 'El token es requerido';
    }
    if (!forgotPassword) {
      newErrors.password = 'La contraseña es requerida';
    } else if (forgotPassword.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!forgotConfirm) {
      newErrors.confirm = 'Confirma la contraseña';
    } else if (forgotConfirm !== forgotPassword) {
      newErrors.confirm = 'Las contraseñas no coinciden';
    }
    setForgotErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestRecovery = async () => {
    if (!validateForgotEmail()) return;
    setForgotLoading(true);
    setForgotErrors({});
    setForgotInfo('');
    try {
      const response = await fetch(RECOVERY_REQUEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        let infoMessage = 'Si el correo existe, recibirás un email con el enlace de recuperación.';
        if (process.env.NODE_ENV === 'development') {
          if (data.token_debug) {
            infoMessage += ` Token debug: ${data.token_debug}`;
            setForgotToken(data.token_debug);
          }
          if (data.reset_url_debug) {
            infoMessage += ' (reset_url_debug disponible en respuesta)';
          }
        }
        setForgotInfo(infoMessage);
        setForgotStep(1);
      } else {
        const errorMessage = data?.detail || data?.error || data?.message || 'No se pudo solicitar la recuperación';
        setForgotErrors({ email: errorMessage });
      }
    } catch (err) {
      setForgotErrors({ email: `Error de conexión: ${err.message}` });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!forgotToken.trim()) {
      setForgotErrors({ token: 'El token es requerido' });
      return;
    }
    setForgotLoading(true);
    setForgotErrors({});
    setForgotInfo('');
    try {
      const response = await fetch(`${RECOVERY_VERIFY_URL}${encodeURIComponent(forgotToken.trim())}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const minutes = data?.minutos_restantes ?? data?.minutes_remaining;
        const infoMessage = minutes
          ? `Token válido. Minutos restantes: ${minutes}.`
          : 'Token válido. Puedes continuar con el cambio de contraseña.';
        setForgotInfo(infoMessage);
        setForgotStep(2);
      } else {
        const errorMessage = data?.detail || data?.error || data?.message || 'Token inválido o expirado';
        setForgotErrors({ token: errorMessage });
      }
    } catch (err) {
      setForgotErrors({ token: `Error de conexión: ${err.message}` });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmRecovery = async () => {
    if (!validateForgotReset()) return;
    setForgotLoading(true);
    setForgotErrors({});
    setForgotInfo('');
    try {
      const payload = {
        token: forgotToken.trim(),
        password: forgotPassword,
        new_password: forgotPassword,
        confirm_password: forgotConfirm
      };
      const response = await fetch(RECOVERY_CONFIRM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setForgotInfo('Tu contraseña fue actualizada. Ahora puedes iniciar sesión.');
        setForgotStep(3);
      } else {
        const errorMessage = data?.detail || data?.error || data?.message || 'No se pudo actualizar la contraseña';
        setForgotErrors({ submit: errorMessage });
      }
    } catch (err) {
      setForgotErrors({ submit: `Error de conexión: ${err.message}` });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleTestAPI = async () => {
    // Función para probar la API directamente
    try {
      console.log('Probando conexión a API...');
      const response = await fetch(LOGIN_API_URL, {
        method: 'OPTIONS',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('OPTIONS response:', response);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'API conectada correctamente. Métodos permitidos: ' + 
                   (response.headers.get('allow') || 'Desconocido'),
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Error en test:', err);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Botón para probar API (solo desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <Button 
            onClick={handleTestAPI}
            variant="outlined" 
            size="small"
            sx={{ mb: 2 }}
          >
            Probar Conexión API
          </Button>
        )}
        
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2,
          }}
        >
          {/* Icono */}
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Lock sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          
          <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Iniciar Sesión
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tus credenciales para acceder al sistema
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            {/* Campo Usuario/Email */}
            <FormControl 
              fullWidth 
              margin="normal" 
              variant="outlined"
              error={!!errors.username}
            >
              <InputLabel htmlFor="username">Usuario o Email</InputLabel>
              <OutlinedInput
                id="username"
                name="username"
                type="text"
                value={credentials.username}
                onChange={handleChange}
                label="Usuario o Email"
                autoComplete="username"
                autoFocus
                disabled={loading}
                startAdornment={
                  <InputAdornment position="start">
                    {credentials.username.includes('@') ? <Email /> : <Person />}
                  </InputAdornment>
                }
              />
              {errors.username && (
                <FormHelperText>{errors.username}</FormHelperText>
              )}
            </FormControl>
            
            {/* Campo Contraseña */}
            <FormControl 
              fullWidth 
              margin="normal" 
              variant="outlined"
              error={!!errors.password}
            >
              <InputLabel htmlFor="password">Contraseña</InputLabel>
              <OutlinedInput
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleChange}
                label="Contraseña"
                autoComplete="current-password"
                disabled={loading}
                startAdornment={
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              {errors.password && (
                <FormHelperText>{errors.password}</FormHelperText>
              )}
            </FormControl>
            
            {/* Recordar contraseña */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Link 
                href="#" 
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenForgot();
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>
            
            {/* Botón de login */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
            
            {/* Enlaces adicionales */}
            <Grid container justifyContent="center" spacing={2}>
              <Grid item>
                <Typography variant="body2" color="text.secondary">
                  ¿No tienes cuenta?{' '}
                  <Link 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/register');
                    }}
                  >
                    Regístrate
                  </Link>
                </Typography>
              </Grid>
              <Grid item>
                <Typography variant="body2" color="text.secondary">
                  <Link 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/dashboard');
                    }}
                  >
                    Volver al inicio
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
        
        {/* Información para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <Paper sx={{ p: 2, mt: 3, width: '100%', backgroundColor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Debug Info:</strong> API: {LOGIN_API_URL}<br />
              <strong>Estado:</strong> {loading ? 'Cargando...' : 'Listo'}<br />
              <strong>Token:</strong> {localStorage.getItem('authToken') ? 'Presente' : 'No encontrado'}
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialogo Recuperar Contraseña */}
      <Dialog open={forgotOpen} onClose={handleCloseForgot} fullWidth maxWidth="sm">
        <DialogTitle>Recuperar contraseña</DialogTitle>
        <DialogContent>
          <Stepper activeStep={forgotStep} sx={{ pt: 2, pb: 3 }}>
            <Step>
              <StepLabel>Solicitar correo</StepLabel>
            </Step>
            <Step>
              <StepLabel>Verificar token</StepLabel>
            </Step>
            <Step>
              <StepLabel>Nueva contraseña</StepLabel>
            </Step>
            <Step>
              <StepLabel>Listo</StepLabel>
            </Step>
          </Stepper>

          {forgotStep === 0 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ingresa tu email para recibir el enlace de recuperacion.
              </Typography>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                error={!!forgotErrors.email}
                helperText={forgotErrors.email}
                disabled={forgotLoading}
              />
            </>
          )}

          {forgotStep === 1 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Revisa tu correo y coloca el token recibido para verificarlo.
              </Typography>
              <TextField
                fullWidth
                label="Token"
                value={forgotToken}
                onChange={(e) => setForgotToken(e.target.value)}
                error={!!forgotErrors.token}
                helperText={forgotErrors.token}
                disabled={forgotLoading}
              />
            </>
          )}

          {forgotStep === 2 && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ingresa tu nueva contraseña.
              </Typography>
              <TextField
                fullWidth
                label="Nueva contraseña"
                type="password"
                value={forgotPassword}
                onChange={(e) => setForgotPassword(e.target.value)}
                error={!!forgotErrors.password}
                helperText={forgotErrors.password}
                disabled={forgotLoading}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Confirmar contraseña"
                type="password"
                value={forgotConfirm}
                onChange={(e) => setForgotConfirm(e.target.value)}
                error={!!forgotErrors.confirm}
                helperText={forgotErrors.confirm}
                disabled={forgotLoading}
              />
            </>
          )}

          {forgotStep === 3 && (
            <Typography variant="body2" color="text.secondary">
              {forgotInfo || 'Proceso finalizado. Ya puedes iniciar sesion.'}
            </Typography>
          )}

          {forgotErrors.submit && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {forgotErrors.submit}
            </Alert>
          )}

          {forgotInfo && forgotStep < 3 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {forgotInfo}
            </Alert>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseForgot} disabled={forgotLoading}>
            Cerrar
          </Button>
          {forgotStep === 0 && (
            <Button
              onClick={handleRequestRecovery}
              variant="contained"
              disabled={forgotLoading}
            >
              {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Solicitar'}
            </Button>
          )}
          {forgotStep === 1 && (
            <Button
              onClick={handleVerifyToken}
              variant="contained"
              disabled={forgotLoading}
            >
              {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Verificar'}
            </Button>
          )}
          {forgotStep === 2 && (
            <Button
              onClick={handleConfirmRecovery}
              variant="contained"
              disabled={forgotLoading}
            >
              {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Actualizar'}
            </Button>
          )}
          {forgotStep === 3 && (
            <Button
              onClick={() => {
                setForgotOpen(false);
                setSnackbar({
                  open: true,
                  message: 'Contraseña actualizada correctamente.',
                  severity: 'success'
                });
              }}
              variant="contained"
            >
              Ir a login
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
