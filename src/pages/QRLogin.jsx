// QRLogin.jsx - CORREGIDO
import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  TextField
} from '@mui/material';
import { QrCode, Refresh, Smartphone, CheckCircle, Error, ContentCopy } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; // <-- CORRECCIÓN AQUÍ

const QRLogin = () => {
  const [qrData, setQrData] = useState(null);
  const [estado, setEstado] = useState('generando');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [codigoManual, setCodigoManual] = useState('');
  const navigate = useNavigate();
  const pollingRef = useRef(null);

  const generarQR = async () => {
    setLoading(true);
    setEstado('generando');
    setCodigoManual('');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/qr-generar/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQrData(data);
        setEstado('pendiente');
        setCodigoManual(data.codigo_sesion);
        iniciarPolling(data.codigo_sesion);
      } else {
        setSnackbar({
          open: true,
          message: 'Error al generar QR: ' + (data.error || 'Desconocido'),
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: 'Error de conexión con el servidor',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const iniciarPolling = (codigoSesion) => {
    // Limpiar intervalo anterior
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    // Iniciar nuevo polling cada 2 segundos
    pollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/qr-status/${codigoSesion}/`);
        const data = await response.json();
        
        if (data.estado === 'aprobada') {
          setEstado('aprobada');
          clearInterval(pollingRef.current);
          
          // Hacer login automático
          await hacerLoginQR(codigoSesion);
          
        } else if (data.estado === 'rechazada' || data.estado === 'expirada' || data.estado === 'cancelada') {
          setEstado(data.estado);
          clearInterval(pollingRef.current);
          
          if (data.estado === 'expirada') {
            setSnackbar({
              open: true,
              message: 'El código QR ha expirado. Genera uno nuevo.',
              severity: 'warning'
            });
          }
        }
      } catch (error) {
        console.error('Error en polling:', error);
      }
    }, 2000);
  };

  const hacerLoginQR = async (codigoSesion) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/qr-login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigo_sesion: codigoSesion })
      });
      
      const data = await response.json();
      
      if (data.access) {
        // Guardar token
        localStorage.setItem('authToken', data.access);
        localStorage.setItem('user', JSON.stringify(data.usuario));
        localStorage.setItem('loginTime', new Date().toISOString());
        
        setSnackbar({
          open: true,
          message: '¡Login exitoso con QR! Redirigiendo...',
          severity: 'success'
        });
        
        // Redirigir después de 1 segundo
        setTimeout(() => navigate('/'), 1000);
      } else {
        setSnackbar({
          open: true,
          message: 'Error en login: ' + (data.error || 'Desconocido'),
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error en login QR:', error);
      setSnackbar({
        open: true,
        message: 'Error de conexión durante el login',
        severity: 'error'
      });
    }
  };

  const copiarCodigo = () => {
    if (codigoManual) {
      navigator.clipboard.writeText(codigoManual);
      setSnackbar({
        open: true,
        message: 'Código copiado al portapapeles',
        severity: 'success'
      });
    }
  };

  useEffect(() => {
    // Generar QR automáticamente al cargar
    generarQR();
    
    // Limpiar intervalo al desmontar
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const getEstadoInfo = () => {
    switch(estado) {
      case 'generando':
        return { 
          color: 'info.main', 
          texto: 'Generando código de sesión...', 
          icon: <CircularProgress size={24} /> 
        };
      case 'pendiente':
        return { 
          color: 'warning.main', 
          texto: 'Escanea con tu dispositivo móvil', 
          icon: <Smartphone /> 
        };
      case 'aprobada':
        return { 
          color: 'success.main', 
          texto: '¡Login aprobado! Redirigiendo...', 
          icon: <CheckCircle /> 
        };
      case 'rechazada':
        return { 
          color: 'error.main', 
          texto: 'Login rechazado por el usuario', 
          icon: <Error /> 
        };
      case 'expirada':
        return { 
          color: 'error.main', 
          texto: 'Código expirado (5 minutos)', 
          icon: <Error /> 
        };
      case 'cancelada':
        return { 
          color: 'error.main', 
          texto: 'Sesión cancelada', 
          icon: <Error /> 
        };
      default:
        return { 
          color: 'info.main', 
          texto: 'Estado desconocido', 
          icon: null 
        };
    }
  };

  const estadoInfo = getEstadoInfo();

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <QrCode sx={{ color: 'white', fontSize: 40 }} />
          </Box>
          
          <Typography variant="h4" gutterBottom>
            Login con Código QR
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Usa tu dispositivo móvil para aprobar el login en esta computadora
          </Typography>
          
          {/* QR Code SVG */}
          {estado === 'pendiente' && codigoManual && (
            <Box sx={{ my: 3 }}>
              <Box sx={{ 
                p: 2, 
                backgroundColor: 'white', 
                display: 'inline-block',
                border: '1px solid #e0e0e0',
                borderRadius: 1
              }}>
                <QRCodeSVG
                  value={`${window.location.origin}/qr-movil?code=${codigoManual}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </Box>
              
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                Escanea este código con tu dispositivo móvil
              </Typography>
            </Box>
          )}
          
          {/* Código de sesión manual */}
          {estado === 'pendiente' && codigoManual && (
            <Card sx={{ mt: 2, mb: 3, border: '1px dashed', borderColor: 'primary.main' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  O copia este código manualmente:
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  backgroundColor: 'grey.50',
                  p: 1.5,
                  borderRadius: 1,
                  mt: 1
                }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      letterSpacing: 1,
                      fontSize: '0.9rem',
                      wordBreak: 'break-all'
                    }}
                  >
                    {codigoManual}
                  </Typography>
                  
                  <Button
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={copiarCodigo}
                    variant="outlined"
                    sx={{ ml: 1, flexShrink: 0 }}
                  >
                    Copiar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
          
          {/* Estado */}
          <Card sx={{ 
            mt: 3, 
            backgroundColor: estadoInfo.color + '10', 
            border: `1px solid ${estadoInfo.color}` 
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Box sx={{ color: estadoInfo.color }}>
                {estadoInfo.icon}
              </Box>
              <Typography variant="body1" sx={{ color: estadoInfo.color, fontWeight: 'medium' }}>
                {estadoInfo.texto}
              </Typography>
            </CardContent>
          </Card>
          
          {/* Instrucciones */}
          <Box sx={{ 
            mt: 3, 
            textAlign: 'left', 
            p: 2, 
            backgroundColor: 'grey.50', 
            borderRadius: 1 
          }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              📱 Instrucciones paso a paso:
            </Typography>
            <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>
                <Typography variant="body2">
                  <strong>En tu celular:</strong> Visita{' '}
                  <span style={{ color: 'primary.main', fontWeight: 'bold' }}>
                    {window.location.origin}/qr-movil
                  </span>
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>En tu celular:</strong> Inicia sesión con tu email y contraseña
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>En tu celular:</strong> Escanea el código QR o ingresa el código manual
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>En tu celular:</strong> Presiona "Aprobar Login en PC"
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>En esta PC:</strong> El login se completará automáticamente
                </Typography>
              </li>
            </ol>
            
            <Typography variant="caption" color="text.secondary">
              ⏱️ El código expira en 5 minutos
            </Typography>
          </Box>
          
          {/* Botones */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={generarQR}
              disabled={loading || estado === 'aprobada'}
              startIcon={<Refresh />}
              sx={{ minWidth: '180px' }}
            >
              {loading ? 'Generando...' : 'Generar Nuevo Código'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Usar Login Normal
            </Button>
          </Box>
          
          {/* Cancelar sesión */}
          {estado === 'pendiente' && (
            <Button
              variant="text"
              color="error"
              size="small"
              onClick={async () => {
                try {
                  const response = await fetch('http://127.0.0.1:8000/qr-cancelar/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ codigo_sesion: codigoManual })
                  });
                  
                  const data = await response.json();
                  if (data.success) {
                    setEstado('cancelada');
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setSnackbar({
                      open: true,
                      message: 'Sesión cancelada correctamente',
                      severity: 'info'
                    });
                  }
                } catch (error) {
                  console.error('Error al cancelar:', error);
                  setSnackbar({
                    open: true,
                    message: 'Error al cancelar la sesión',
                    severity: 'error'
                  });
                }
              }}
              sx={{ mt: 2 }}
            >
              Cancelar esta sesión
            </Button>
          )}
        </Paper>
        
        {/* Información de debug */}
        {process.env.NODE_ENV === 'development' && qrData && (
          <Paper sx={{ p: 2, mt: 3, width: '100%', backgroundColor: 'grey.100' }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Debug:</strong><br/>
              <strong>Código:</strong> {codigoManual}<br/>
              <strong>Expira:</strong> {new Date(qrData.expiracion).toLocaleTimeString()}<br/>
              <strong>Estado:</strong> {estado}<br/>
              <strong>URL QR:</strong> {`${window.location.origin}/qr-movil?code=${codigoManual}`}
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default QRLogin;