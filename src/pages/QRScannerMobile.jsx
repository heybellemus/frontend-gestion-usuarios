// QRScannerMobile.jsx - Para usar en el celular
import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

const QRScannerMobile = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigoQR, setCodigoQR] = useState('');
  const [loading, setLoading] = useState(false);
  const [paso, setPaso] = useState(1); // 1: Login, 2: Escanear
  
  // Paso 1: Login normal en móvil
  const handleLoginMovil = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Guardar token en móvil
        localStorage.setItem('authToken', data.access);
        localStorage.setItem('user', JSON.stringify(data.usuario));
        
        // Ir al paso 2 (escanear)
        setPaso(2);
      } else {
        alert('Error: ' + (data.error || 'Credenciales incorrectas'));
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };
  
  // Paso 2: Escanear QR (simulado con input)
  const handleEscanearQR = async () => {
    if (!codigoQR) {
      alert('Ingresa el código QR');
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('authToken');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/qr-escanear/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ codigo_sesion: codigoQR })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Login aprobado! La PC se logueará automáticamente.');
        setCodigoQR('');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };
  
  // Usar cámara real (opcional)
  const usarCamara = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Configurar cámara y usar librería jsQR o similar
      alert('Funcionalidad de cámara activada (necesitarías implementar detección QR)');
    } else {
      alert('Cámara no disponible en este dispositivo');
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, p: 2 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" align="center" gutterBottom>
            {paso === 1 ? 'Login en Móvil' : 'Aprobar Login en PC'}
          </Typography>
          
          {paso === 1 ? (
            // PASO 1: Login en móvil
            <Box component="form" onSubmit={handleLoginMovil}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                Después de login, podrás aprobar logins en tu PC escaneando un QR
              </Typography>
            </Box>
          ) : (
            // PASO 2: Escanear QR
            <Box>
              <Typography variant="body1" paragraph>
                Para aprobar el login en tu PC:
              </Typography>
              
              <ol>
                <li>En tu PC, ve a Login con QR</li>
                <li>Aparecerá un código QR</li>
                <li>Escanea ese código o ingresa el código manualmente:</li>
              </ol>
              
              <TextField
                fullWidth
                label="Código QR (de la PC)"
                value={codigoQR}
                onChange={(e) => setCodigoQR(e.target.value)}
                margin="normal"
                placeholder="Ej: 7x9k2p5r8t3w1y4z"
              />
              
              <Button
                fullWidth
                variant="outlined"
                onClick={usarCamara}
                startIcon={<QrCodeScannerIcon />}
                sx={{ mt: 1 }}
              >
                Usar Cámara para Escanear
              </Button>
              
              <Button
                fullWidth
                variant="contained"
                onClick={handleEscanearQR}
                disabled={loading || !codigoQR}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Aprobar Login en PC'}
              </Button>
              
              <Button
                fullWidth
                variant="text"
                onClick={() => setPaso(1)}
                sx={{ mt: 1 }}
              >
                Volver al Login
              </Button>
            </Box>
          )}
        </Paper>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          <strong>Modo de uso:</strong><br/>
          1. Abre esta página en tu celular<br/>
          2. Inicia sesión normalmente<br/>
          3. Luego escanea el QR que aparece en tu PC
        </Alert>
      </Box>
    </Container>
  );
};

export default QRScannerMobile;