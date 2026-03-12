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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Grid,
  Box,
  Chip,
  Tooltip,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// URL de la API
const API_URL = 'http://127.0.0.1:8000/api/clientes/';

// Función para obtener headers con autenticación
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

// Componente principal de Clientes
const ClientesCRUD = () => {
  // Estados para los clientes
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para el cliente actual (para edición/creación)
  const [clienteActual, setClienteActual] = useState({
    tipodocumento: 'DNI',
    numerodocumento: '',
    razonsocial: '',
    nombrecomercial: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: 'Lima',
    pais: 'Perú',
    activo: true
  });
  
  // Estado para el cliente a eliminar
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('razonsocial');

  // Tipos de documento permitidos
  const tiposDocumento = [
    { value: 'DNI', label: 'DNI' },
    { value: 'RUC', label: 'RUC' },
    { value: 'CE', label: 'Carné de Extranjería' },
    { value: 'PASAPORTE', label: 'Pasaporte' }
  ];

  // Campos de búsqueda
  const camposBusqueda = [
    { value: 'razonsocial', label: 'Razón Social' },
    { value: 'numerodocumento', label: 'N° Documento' },
    { value: 'email', label: 'Email' },
    { value: 'ciudad', label: 'Ciudad' }
  ];

  // Función para obtener clientes
  const fetchClientes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_URL, { headers: getHeaders() });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setClientes(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error al cargar clientes: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClientes();
  }, []);

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Abrir diálogo para crear nuevo cliente
  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setClienteActual({
      tipodocumento: '',
      numerodocumento: '',
      razonsocial: '',
      nombrecomercial: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      pais: '',
      activo: true
    });
    setOpenDialog(true);
  };

  // Abrir diálogo para editar cliente
  const handleOpenEditDialog = (cliente) => {
    setIsEditing(true);
    setClienteActual(cliente);
    setOpenDialog(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setClienteActual({
      ...clienteActual,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Guardar cliente (crear o actualizar)
  const handleSaveCliente = async () => {
    // Validaciones básicas
    if (!clienteActual.numerodocumento || !clienteActual.razonsocial) {
      setSnackbar({
        open: true,
        message: 'Número de documento y razón social son obligatorios',
        severity: 'warning'
      });
      return;
    }

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_URL}${clienteActual.clienteid}/` : API_URL;
      
      const response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(clienteActual)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar lista de clientes
      await fetchClientes();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: `Cliente ${isEditing ? 'actualizado' : 'creado'} correctamente`,
        severity: 'success'
      });
      
      // Cerrar diálogo
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error al guardar cliente: ${err.message}`,
        severity: 'error'
      });
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = (cliente) => {
    setClienteAEliminar(cliente);
    setOpenDeleteDialog(true);
  };

  // Eliminar cliente
  const handleDeleteCliente = async () => {
    if (!clienteAEliminar) return;

    try {
      const response = await fetch(`${API_URL}${clienteAEliminar.clienteid}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Actualizar lista de clientes
      await fetchClientes();
      
      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: 'Cliente eliminado correctamente',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Error al eliminar cliente: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setOpenDeleteDialog(false);
      setClienteAEliminar(null);
    }
  };

  // Cerrar diálogo de eliminación
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setClienteAEliminar(null);
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Manejar búsqueda
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchClientes();
      return;
    }

    setLoading(true);
    try {
      // En una implementación real, aquí deberías usar parámetros de consulta
      // Como la API no tiene endpoints de búsqueda, filtramos en el frontend
      const response = await fetch(API_URL, { headers: getHeaders() });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Filtrar resultados en el frontend
      const filtered = data.results.filter(cliente => {
        if (cliente[searchField]) {
          return cliente[searchField].toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
      
      setClientes(filtered);
      setTotalCount(filtered.length);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error en búsqueda: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm('');
    fetchClientes();
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No registrado';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Datos paginados
  const paginatedClientes = clientes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Encabezado */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Clientes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {/* Panel de búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Buscar por</InputLabel>
              <Select
                value={searchField}
                label="Buscar por"
                onChange={(e) => setSearchField(e.target.value)}
              >
                {camposBusqueda.map((campo) => (
                  <MenuItem key={campo.value} value={campo.value}>
                    {campo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Término de búsqueda"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} edge="end">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleClearSearch}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de clientes */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button
              variant="outlined"
              onClick={fetchClientes}
              sx={{ mt: 2 }}
            >
              Reintentar
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Documento</TableCell>
                    <TableCell>Razón Social</TableCell>
                    <TableCell>Nombre Comercial</TableCell>
                    <TableCell>Contacto</TableCell>
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedClientes.map((cliente) => (
                    <TableRow key={cliente.clienteid} hover>
                      <TableCell>{cliente.clienteid}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {cliente.tipodocumento}
                          </Typography>
                          <Typography variant="body1">
                            {cliente.numerodocumento}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{cliente.razonsocial}</TableCell>
                      <TableCell>
                        {cliente.nombrecomercial || (
                          <Typography variant="body2" color="textSecondary" fontStyle="italic">
                            No definido
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          {cliente.telefono && (
                            <Typography variant="body2">{cliente.telefono}</Typography>
                          )}
                          {cliente.email && (
                            <Typography variant="body2" color="primary">
                              {cliente.email}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{cliente.ciudad || 'No registrada'}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {cliente.pais || 'No registrado'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {cliente.activo === true ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Activo"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        ) : cliente.activo === false ? (
                          <Chip
                            icon={<CancelIcon />}
                            label="Inactivo"
                            color="error"
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="No definido"
                            color="default"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEditDialog(cliente)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            onClick={() => handleConfirmDelete(cliente)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count}`
              }
            />
          </>
        )}
      </Paper>

      {/* Diálogo para crear/editar cliente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  name="tipodocumento"
                  value={clienteActual.tipodocumento}
                  onChange={handleInputChange}
                  label="Tipo de Documento"
                >
                  {tiposDocumento.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="numerodocumento"
                label="Número de Documento"
                value={clienteActual.numerodocumento}
                onChange={handleInputChange}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                name="razonsocial"
                label="Razón Social *"
                value={clienteActual.razonsocial}
                onChange={handleInputChange}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                name="nombrecomercial"
                label="Nombre Comercial"
                value={clienteActual.nombrecomercial}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="telefono"
                label="Teléfono"
                value={clienteActual.telefono}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="email"
                label="Email"
                type="email"
                value={clienteActual.email}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="normal"
                name="direccion"
                label="Dirección"
                value={clienteActual.direccion}
                onChange={handleInputChange}
                size="small"
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="ciudad"
                label="Ciudad"
                value={clienteActual.ciudad}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="normal"
                name="pais"
                label="País"
                value={clienteActual.pais}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="activo"
                    checked={clienteActual.activo === true}
                    onChange={handleInputChange}
                    color="primary"
                  />
                }
                label="Cliente Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSaveCliente}
            variant="contained"
            color="primary"
          >
            {isEditing ? 'Actualizar' : 'Crear'}
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
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de eliminar el cliente{' '}
            <strong>{clienteAEliminar?.razonsocial}</strong>?
            <br />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Documento: {clienteAEliminar?.tipodocumento} {clienteAEliminar?.numerodocumento}
            </Typography>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button
            onClick={handleDeleteCliente}
            variant="contained"
            color="error"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Información adicional */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="body2" color="textSecondary">
          Total de clientes: {totalCount} | Mostrando {paginatedClientes.length} clientes
        </Typography>
        {isEditing && clienteActual.fechacreacion && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Creado el: {formatDate(clienteActual.fechacreacion)} | 
            {clienteActual.fechamodificacion && ` Modificado el: ${formatDate(clienteActual.fechamodificacion)}`}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default ClientesCRUD;