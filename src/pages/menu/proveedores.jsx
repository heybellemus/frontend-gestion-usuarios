import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  Box,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  TablePagination,
  CircularProgress,
  Backdrop,
  Avatar,
  Stack,
  FormHelperText,
  Grid,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Select,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Person as PersonIcon,
  AccountBalance as BankIcon,
  Description as DescriptionIcon,
  Visibility as VisibilityIcon,
  Numbers as NumbersIcon,
  Assignment as AssignmentIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Category as CategoryIcon,
  Event as EventIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// Librerías para exportación
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = 'http://127.0.0.1:8000/api/menu-proveedores/';

// Componente para mostrar información en vista detallada de forma vertical
const DetailItem = ({ icon: Icon, label, value, color = 'textPrimary' }) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
      <Icon fontSize="small" color="action" />
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
    </Box>
    <Typography variant="body1" color={color} sx={{ pl: 3.5 }}>
      {value || 'N/A'}
    </Typography>
  </Box>
);

// Componente de Sección para vista detallada
const DetailSection = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
      {title}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    {children}
  </Box>
);

const ProveedoresCRUD = () => {
  // Estados para datos
  const [proveedores, setProveedores] = useState([]);
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    activo: 'todos',
    fechaInicio: null,
    fechaFin: null
  });
  const [openFilters, setOpenFilters] = useState(false);
  
  // Estados para menú de exportación
  const [anchorElExport, setAnchorElExport] = useState(null);
  const openExportMenu = Boolean(anchorElExport);
  
  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre_comercial: '',
    rtn: '',
    direccion: '',
    persona_contacto: '',
    telefono: '',
    correo_electronico: '',
    datos_bancarios: '',
    observaciones: '',
    activo: true
  });

  // Estado para validación
  const [formErrors, setFormErrors] = useState({});

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

  // Obtener proveedores
  const fetchProveedores = async () => {
    setLoading(true);
    try {
      let nextUrl = API_URL;
      let allProveedores = [];
      let total = 0;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar los proveedores');

        const data = await response.json();
        console.log('Datos recibidos:', data);

        if (Array.isArray(data)) {
          allProveedores = data;
          total = data.length;
          break;
        }

        allProveedores = [...allProveedores, ...(data.results || [])];
        total = data.count || allProveedores.length;
        nextUrl = data.next;
      }

      setProveedores(allProveedores);
      setFilteredProveedores(allProveedores);
      setTotalCount(total || allProveedores.length);

    } catch (error) {
      console.error('Error en fetchProveedores:', error);
      showSnackbar('Error al cargar los proveedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [filters, proveedores]);

  const applyFilters = () => {
    let filtered = [...proveedores];

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(prov => 
        prov.nombre_comercial.toLowerCase().includes(searchLower) ||
        (prov.rtn && prov.rtn.toLowerCase().includes(searchLower)) ||
        (prov.persona_contacto && prov.persona_contacto.toLowerCase().includes(searchLower)) ||
        (prov.correo_electronico && prov.correo_electronico.toLowerCase().includes(searchLower)) ||
        (prov.telefono && prov.telefono.includes(searchLower))
      );
    }

    // Filtro de estado
    if (filters.activo !== 'todos') {
      const estadoValue = filters.activo === 'activo';
      filtered = filtered.filter(prov => prov.activo === estadoValue);
    }

    // Filtro de fechas
    if (filters.fechaInicio) {
      filtered = filtered.filter(prov => {
        if (!prov.fecha_creacion) return false;
        const provDate = new Date(prov.fecha_creacion);
        return provDate >= filters.fechaInicio;
      });
    }

    if (filters.fechaFin) {
      filtered = filtered.filter(prov => {
        if (!prov.fecha_creacion) return false;
        const provDate = new Date(prov.fecha_creacion);
        const endDate = new Date(filters.fechaFin);
        endDate.setHours(23, 59, 59, 999);
        return provDate <= endDate;
      });
    }

    setFilteredProveedores(filtered);
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      activo: 'todos',
      fechaInicio: null,
      fechaFin: null
    });
  };

  // Crear nuevo proveedor
  const createProveedor = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const proveedorData = {
        nombre_comercial: formData.nombre_comercial.trim(),
        rtn: formData.rtn?.trim() || '',
        direccion: formData.direccion?.trim() || '',
        persona_contacto: formData.persona_contacto?.trim() || '',
        telefono: formData.telefono?.trim() || '',
        correo_electronico: formData.correo_electronico?.trim() || '',
        datos_bancarios: formData.datos_bancarios?.trim() || '',
        observaciones: formData.observaciones?.trim() || '',
        activo: formData.activo,
        fecha_creacion: new Date().toISOString().split('T')[0]
      };

      console.log('Enviando datos al backend:', proveedorData);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(proveedorData)
      });
      
      const responseText = await response.text();
      console.log('Respuesta del backend (texto):', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Error al crear el proveedor';
        try {
          const errorData = JSON.parse(responseText);
          console.error('Error response:', errorData);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      showSnackbar('Proveedor creado exitosamente', 'success');
      handleCloseDialog();
      await fetchProveedores();
      
    } catch (error) {
      console.error('Error en createProveedor:', error);
      showSnackbar(error.message || 'Error al crear el proveedor', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Actualizar proveedor existente
  const updateProveedor = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const proveedorData = {
        nombre_comercial: formData.nombre_comercial.trim(),
        rtn: formData.rtn?.trim() || '',
        direccion: formData.direccion?.trim() || '',
        persona_contacto: formData.persona_contacto?.trim() || '',
        telefono: formData.telefono?.trim() || '',
        correo_electronico: formData.correo_electronico?.trim() || '',
        datos_bancarios: formData.datos_bancarios?.trim() || '',
        observaciones: formData.observaciones?.trim() || '',
        activo: formData.activo,
        fecha_creacion: selectedProveedor.fecha_creacion || new Date().toISOString().split('T')[0]
      };

      console.log('Actualizando proveedor:', proveedorData);

      const response = await fetch(`${API_URL}${selectedProveedor.id_proveedor}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(proveedorData)
      });
      
      const responseText = await response.text();
      console.log('Respuesta del backend (texto):', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Error al actualizar el proveedor';
        try {
          const errorData = JSON.parse(responseText);
          console.error('Error response:', errorData);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      showSnackbar('Proveedor actualizado exitosamente', 'success');
      handleCloseDialog();
      await fetchProveedores();
      
    } catch (error) {
      console.error('Error en updateProveedor:', error);
      showSnackbar(error.message || 'Error al actualizar el proveedor', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Eliminar proveedor
  const deleteProveedor = async () => {
    setLoadingAction(true);
    try {
      const response = await fetch(`${API_URL}${selectedProveedor.id_proveedor}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al eliminar el proveedor');
      }
      
      showSnackbar('Proveedor eliminado exitosamente', 'success');
      setOpenDeleteDialog(false);
      
      // Recargar datos
      await fetchProveedores();
      
    } catch (error) {
      console.error('Error en deleteProveedor:', error);
      showSnackbar('Error al eliminar el proveedor', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Funciones de exportación
  const exportToExcel = () => {
    try {
      const dataToExport = filteredProveedores.map(prov => ({
        ID: prov.id_proveedor,
        'Nombre Comercial': prov.nombre_comercial,
        RTN: prov.rtn || '',
        Dirección: prov.direccion || '',
        'Persona Contacto': prov.persona_contacto || '',
        Teléfono: prov.telefono || '',
        Email: prov.correo_electronico || '',
        'Datos Bancarios': prov.datos_bancarios || '',
        Observaciones: prov.observaciones || '',
        Estado: prov.activo ? 'Activo' : 'Inactivo',
        'Fecha Creación': formatDate(prov.fecha_creacion)
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');
      XLSX.writeFile(wb, `proveedores_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showSnackbar('Archivo Excel exportado exitosamente', 'success');
      handleCloseExportMenu();
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      showSnackbar('Error al exportar a Excel', 'error');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape'
      });
      
      // Título
      doc.setFontSize(18);
      doc.text('Listado de Proveedores', 14, 22);
      
      // Subtítulo con fecha
      doc.setFontSize(11);
      doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, 14, 32);
      
      // Información de filtros
      let filtrosAplicados = [];
      if (filters.search) filtrosAplicados.push(`Búsqueda: "${filters.search}"`);
      if (filters.activo !== 'todos') filtrosAplicados.push(`Estado: ${filters.activo}`);
      if (filters.fechaInicio) filtrosAplicados.push(`Desde: ${filters.fechaInicio.toLocaleDateString()}`);
      if (filters.fechaFin) filtrosAplicados.push(`Hasta: ${filters.fechaFin.toLocaleDateString()}`);
      
      if (filtrosAplicados.length > 0) {
        doc.setFontSize(10);
        doc.text('Filtros aplicados:', 14, 40);
        doc.text(filtrosAplicados.join(' • '), 14, 46);
      }
      
      // Datos para la tabla
      const tableColumn = ['ID', 'Nombre Comercial', 'RTN', 'Contacto', 'Teléfono', 'Email', 'Estado', 'Fecha Creación'];
      const tableRows = filteredProveedores.map(prov => [
        prov.id_proveedor,
        prov.nombre_comercial,
        prov.rtn || '-',
        prov.persona_contacto || '-',
        prov.telefono || '-',
        prov.correo_electronico || '-',
        prov.activo ? 'Activo' : 'Inactivo',
        formatDate(prov.fecha_creacion)
      ]);
      
      // Generar tabla
      doc.autoTable({
        startY: filtrosAplicados.length > 0 ? 52 : 38,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [63, 81, 181] }
      });
      
      // Total de registros
      doc.setFontSize(10);
      doc.text(`Total de registros: ${filteredProveedores.length}`, 14, doc.lastAutoTable.finalY + 10);
      
      doc.save(`proveedores_${new Date().toISOString().split('T')[0]}.pdf`);
      
      showSnackbar('Archivo PDF exportado exitosamente', 'success');
      handleCloseExportMenu();
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      showSnackbar('Error al exportar a PDF', 'error');
    }
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    if (!formData.nombre_comercial?.trim()) {
      errors.nombre_comercial = 'El nombre comercial es requerido';
    }
    if (formData.rtn && !/^\d{14}$/.test(formData.rtn)) {
      errors.rtn = 'El RTN debe tener 14 dígitos';
    }
    if (formData.correo_electronico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_electronico)) {
      errors.correo_electronico = 'Correo electrónico inválido';
    }
    if (formData.telefono && !/^[\d\s\-+()]{8,20}$/.test(formData.telefono)) {
      errors.telefono = 'Teléfono inválido';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Utilidades
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenCreateDialog = () => {
    setSelectedProveedor(null);
    setFormData({
      nombre_comercial: '',
      rtn: '',
      direccion: '',
      persona_contacto: '',
      telefono: '',
      correo_electronico: '',
      datos_bancarios: '',
      observaciones: '',
      activo: true
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (proveedor) => {
    setSelectedProveedor(proveedor);
    setFormData({
      nombre_comercial: proveedor.nombre_comercial,
      rtn: proveedor.rtn || '',
      direccion: proveedor.direccion || '',
      persona_contacto: proveedor.persona_contacto || '',
      telefono: proveedor.telefono || '',
      correo_electronico: proveedor.correo_electronico || '',
      datos_bancarios: proveedor.datos_bancarios || '',
      observaciones: proveedor.observaciones || '',
      activo: proveedor.activo
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenViewDialog = (proveedor) => {
    setSelectedProveedor(proveedor);
    setOpenViewDialog(true);
  };

  const handleOpenDeleteDialog = (proveedor) => {
    setSelectedProveedor(proveedor);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProveedor(null);
    setFormData({
      nombre_comercial: '',
      rtn: '',
      direccion: '',
      persona_contacto: '',
      telefono: '',
      correo_electronico: '',
      datos_bancarios: '',
      observaciones: '',
      activo: true
    });
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (selectedProveedor) {
      updateProveedor();
    } else {
      createProveedor();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSwitchChange = (e) => {
    setFormData(prev => ({
      ...prev,
      activo: e.target.checked
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    clearFilters();
    fetchProveedores();
    showSnackbar('Datos actualizados', 'info');
  };

  const handleExportClick = (event) => {
    setAnchorElExport(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setAnchorElExport(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Fecha no disponible';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  };

  // Obtener datos de la página actual
  const getCurrentPageData = () => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredProveedores.slice(start, end);
  };

  const currentPageData = getCurrentPageData();

  const hasActiveFilters = () => {
    return filters.search || filters.activo !== 'todos' || filters.fechaInicio || filters.fechaFin;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loadingAction}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        {/* Header */}
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <BusinessIcon />
              </Avatar>
              <Typography variant="h5" component="h1">
                Gestión de Proveedores
              </Typography>
              <Badge
                badgeContent={filteredProveedores.length}
                color="primary"
                showZero
                max={999}
              >
                <Chip 
                  label={`Total: ${totalCount}`} 
                  size="small" 
                  variant="outlined"
                />
              </Badge>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Exportar datos">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportClick}
                  disabled={filteredProveedores.length === 0}
                >
                  Exportar
                </Button>
              </Tooltip>
              <Menu
                anchorEl={anchorElExport}
                open={openExportMenu}
                onClose={handleCloseExportMenu}
              >
                <MenuItem onClick={exportToExcel}>
                  <ListItemIcon>
                    <ExcelIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText>Exportar a Excel</ListItemText>
                </MenuItem>
                <MenuItem onClick={exportToPDF}>
                  <ListItemIcon>
                    <PdfIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Exportar a PDF</ListItemText>
                </MenuItem>
              </Menu>
              
              <Tooltip title="Refrescar datos">
                <IconButton onClick={handleRefresh} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
              >
                Nuevo Proveedor
              </Button>
            </Box>
          </Box>

          {/* Filtros */}
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por nombre, RTN, contacto, email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: filters.search && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => handleFilterChange('search', '')}
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.activo}
                    label="Estado"
                    onChange={(e) => handleFilterChange('activo', e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="activo">Activos</MenuItem>
                    <MenuItem value="inactivo">Inactivos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Fecha desde"
                  value={filters.fechaInicio}
                  onChange={(date) => handleFilterChange('fechaInicio', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Fecha hasta"
                  value={filters.fechaFin}
                  onChange={(date) => handleFilterChange('fechaFin', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Badge
                    color="secondary"
                    variant="dot"
                    invisible={!hasActiveFilters()}
                  >
                    <Button
                      size="small"
                      startIcon={<FilterIcon />}
                      color="primary"
                      variant="outlined"
                    >
                      Filtros
                    </Button>
                  </Badge>
                  <Button
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    color="inherit"
                  >
                    Limpiar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Tabla */}
        <Paper elevation={3}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre Comercial</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>RTN</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contacto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Teléfono</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Creación</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                        Cargando proveedores...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : currentPageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No hay proveedores disponibles
                      </Typography>
                      {hasActiveFilters() && (
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Intenta ajustar los filtros de búsqueda
                        </Typography>
                      )}
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleOpenCreateDialog}
                        sx={{ mt: 2 }}
                      >
                        Crear proveedor
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageData.map((proveedor) => (
                    <TableRow 
                      key={proveedor.id_proveedor}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Chip 
                          label={proveedor.id_proveedor} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {proveedor.nombre_comercial}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={proveedor.rtn || 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {proveedor.persona_contacto || 'Sin contacto'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {proveedor.telefono || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {proveedor.correo_electronico || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={proveedor.activo ? 'Activo' : 'Inactivo'}
                          color={proveedor.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formatDate(proveedor.fecha_creacion)}>
                          <Chip
                            label={formatDate(proveedor.fecha_creacion)}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Ver detalles">
                            <IconButton
                              color="info"
                              onClick={() => handleOpenViewDialog(proveedor)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenEditDialog(proveedor)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDeleteDialog(proveedor)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {!loading && filteredProveedores.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredProveedores.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              showFirstButton
              showLastButton
            />
          )}
        </Paper>

        {/* Diálogo de Vista de Detalles - Estilo Lotes */}
        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <BusinessIcon />
              </Avatar>
              <Typography variant="h6">
                Detalles del Proveedor: {selectedProveedor?.nombre_comercial}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedProveedor && (
              <Box>
                {/* Información General */}
                <DetailSection title="Información General">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={NumbersIcon}
                        label="ID del Proveedor"
                        value={selectedProveedor.id_proveedor}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={BusinessIcon}
                        label="Nombre Comercial"
                        value={selectedProveedor.nombre_comercial}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={AssignmentIcon}
                        label="RTN"
                        value={selectedProveedor.rtn}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={PhoneIcon}
                        label="Teléfono"
                        value={selectedProveedor.telefono}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <DetailItem 
                        icon={LocationIcon}
                        label="Dirección"
                        value={selectedProveedor.direccion}
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Información de Contacto */}
                <DetailSection title="Información de Contacto">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={PersonIcon}
                        label="Persona de Contacto"
                        value={selectedProveedor.persona_contacto}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={EmailIcon}
                        label="Correo Electrónico"
                        value={selectedProveedor.correo_electronico}
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Información Financiera */}
                <DetailSection title="Información Financiera">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <DetailItem 
                        icon={BankIcon}
                        label="Datos Bancarios"
                        value={selectedProveedor.datos_bancarios}
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Estado y Fechas */}
                <DetailSection title="Estado y Fechas">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CategoryIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="textSecondary">
                            Estado
                          </Typography>
                        </Box>
                        <Box sx={{ pl: 3.5 }}>
                          <Chip
                            label={selectedProveedor.activo ? 'Activo' : 'Inactivo'}
                            color={selectedProveedor.activo ? 'success' : 'default'}
                          />
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={DateRangeIcon}
                        label="Fecha de Creación"
                        value={formatDate(selectedProveedor.fecha_creacion)}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <DetailItem 
                        icon={DescriptionIcon}
                        label="Observaciones"
                        value={selectedProveedor.observaciones || 'Sin observaciones'}
                      />
                    </Grid>
                  </Grid>
                </DetailSection>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)} variant="outlined">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para Crear/Editar */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          disableEscapeKeyDown={loadingAction}
        >
          <DialogTitle>
            <Typography variant="h6">
              {selectedProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Nombre Comercial *"
                name="nombre_comercial"
                value={formData.nombre_comercial}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.nombre_comercial}
                helperText={formErrors.nombre_comercial}
                disabled={loadingAction}
                variant="outlined"
                autoFocus
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="RTN"
                    name="rtn"
                    value={formData.rtn}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!formErrors.rtn}
                    helperText={formErrors.rtn}
                    disabled={loadingAction}
                    variant="outlined"
                    placeholder="14 dígitos"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!formErrors.telefono}
                    helperText={formErrors.telefono}
                    disabled={loadingAction}
                    variant="outlined"
                    placeholder="Ej: 9999-9999"
                  />
                </Grid>
              </Grid>

              <TextField
                label="Dirección"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={loadingAction}
                variant="outlined"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Persona de Contacto"
                    name="persona_contacto"
                    value={formData.persona_contacto}
                    onChange={handleInputChange}
                    fullWidth
                    disabled={loadingAction}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Correo Electrónico"
                    name="correo_electronico"
                    value={formData.correo_electronico}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!formErrors.correo_electronico}
                    helperText={formErrors.correo_electronico}
                    disabled={loadingAction}
                    variant="outlined"
                    placeholder="ejemplo@correo.com"
                  />
                </Grid>
              </Grid>

              <TextField
                label="Datos Bancarios"
                name="datos_bancarios"
                value={formData.datos_bancarios}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={loadingAction}
                variant="outlined"
                placeholder="Información de cuenta bancaria"
              />

              <TextField
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={loadingAction}
                variant="outlined"
                placeholder="Observaciones adicionales"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={handleSwitchChange}
                    color="primary"
                    disabled={loadingAction}
                  />
                }
                label="Proveedor activo"
              />

              {!selectedProveedor && (
                <FormHelperText>
                  La fecha de creación se asignará automáticamente en el servidor
                </FormHelperText>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDialog} 
              disabled={loadingAction}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              disabled={loadingAction || !formData.nombre_comercial?.trim()}
              startIcon={loadingAction ? <CircularProgress size={20} /> : null}
            >
              {loadingAction ? 'Guardando...' : (selectedProveedor ? 'Actualizar' : 'Crear')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Confirmación para Eliminar */}
        <Dialog 
          open={openDeleteDialog} 
          onClose={() => !loadingAction && setOpenDeleteDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" color="error">
              Confirmar Eliminación
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body1" gutterBottom>
              ¿Estás seguro de que deseas eliminar el proveedor?
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {selectedProveedor?.nombre_comercial}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                RTN: {selectedProveedor?.rtn || 'N/A'}
              </Typography>
              {selectedProveedor?.correo_electronico && (
                <Typography variant="body2" color="textSecondary">
                  Email: {selectedProveedor.correo_electronico}
                </Typography>
              )}
            </Paper>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenDeleteDialog(false)} 
              disabled={loadingAction}
            >
              Cancelar
            </Button>
            <Button 
              onClick={deleteProveedor} 
              variant="contained" 
              color="error"
              disabled={loadingAction}
              startIcon={loadingAction ? <CircularProgress size={20} /> : null}
            >
              {loadingAction ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificaciones */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
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
      </Container>
    </LocalizationProvider>
  );
};

export default ProveedoresCRUD;