import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Divider,
  Paper as MuiPaper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Visibility as VisibilityIcon,
  Category as CategoryIcon,
  Label as LabelIcon,
  Description as DescriptionIcon,
  PriorityHigh as PriorityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  Sort as SortIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// Librerías para exportación
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = 'http://127.0.0.1:8000/api/cat-tipos-movimiento/';

// Componente Card personalizado
const Card = ({ children, variant, sx, onClick }) => (
  <MuiPaper variant={variant} sx={sx} onClick={onClick}>
    {children}
  </MuiPaper>
);

const CardContent = ({ children, sx }) => (
  <Box sx={{ p: 2, ...sx }}>
    {children}
  </Box>
);

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

// Función para obtener el icono según el signo
const getSignoIcon = (signo) => {
  switch(signo) {
    case '+':
      return <AddCircleIcon fontSize="small" color="success" />;
    case '-':
      return <RemoveCircleIcon fontSize="small" color="error" />;
    case '+/-':
      return <SwapHorizIcon fontSize="small" color="info" />;
    default:
      return <PriorityIcon fontSize="small" />;
  }
};

const getSignoColor = (signo) => {
  switch(signo) {
    case '+': return 'success';
    case '-': return 'error';
    case '+/-': return 'info';
    default: return 'default';
  }
};

const TiposMovimientoCRUD = () => {
  // Estados para datos
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [filteredTipos, setFilteredTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Estados para paginación (cliente-side optimizada)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados para filtros optimizados
  const [filters, setFilters] = useState({
    search: '',
    signo: 'todos',
    requierePrecio: 'todos',
    activo: 'todos',
    ordenMin: '',
    ordenMax: ''
  });
  
  // Estado para aplicar filtros con debounce
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  
  // Estados para menú de exportación
  const [anchorElExport, setAnchorElExport] = useState(null);
  const openExportMenu = Boolean(anchorElExport);
  
  // Estados para diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    codigo_tipo: '',
    nombre_tipo: '',
    descripcion: '',
    signo: '+',
    requiere_precio: false,
    activo: true,
    orden: ''
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

  // Función para obtener TODOS los tipos de movimiento (manejando paginación)
  const fetchAllTiposMovimiento = async () => {
    setLoading(true);
    try {
      let allTipos = [];
      let nextUrl = API_URL;
      let pageCount = 0;

      showSnackbar('Cargando todos los tipos de movimiento...', 'info');

      while (nextUrl) {
        pageCount++;
        console.log(`Cargando página ${pageCount} de tipos de movimiento...`);
        
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar los tipos de movimiento');

        const data = await response.json();
        allTipos = [...allTipos, ...(data.results || [])];
        nextUrl = data.next;
      }

      console.log(`Total de tipos de movimiento cargados: ${allTipos.length} (${pageCount} páginas)`);

      setTiposMovimiento(allTipos);
      setFilteredTipos(allTipos);
      setTotalCount(allTipos.length);

      showSnackbar(`${allTipos.length} tipos de movimiento cargados exitosamente`, 'success');

    } catch (error) {
      console.error('Error en fetchAllTiposMovimiento:', error);
      showSnackbar('Error al cargar los tipos de movimiento', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchAllTiposMovimiento();
  }, []);

  // Debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Aplicar filtros optimizados
  useEffect(() => {
    applyFilters();
  }, [debouncedFilters, tiposMovimiento]);

  // Función de filtrado optimizada
  const applyFilters = useCallback(() => {
    const filtered = tiposMovimiento.filter(tipo => {
      // Filtro de búsqueda
      if (debouncedFilters.search) {
        const searchLower = debouncedFilters.search.toLowerCase();
        const matchesSearch = 
          tipo.codigo_tipo?.toLowerCase().includes(searchLower) ||
          tipo.nombre_tipo?.toLowerCase().includes(searchLower) ||
          tipo.descripcion?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro por signo
      if (debouncedFilters.signo !== 'todos' && tipo.signo !== debouncedFilters.signo) {
        return false;
      }

      // Filtro por requiere_precio
      if (debouncedFilters.requierePrecio !== 'todos') {
        const requiereValue = debouncedFilters.requierePrecio === 'si';
        if (tipo.requiere_precio !== requiereValue) return false;
      }

      // Filtro por activo
      if (debouncedFilters.activo !== 'todos') {
        const activoValue = debouncedFilters.activo === 'activo';
        if (tipo.activo !== activoValue) return false;
      }

      // Filtro por rango de orden
      if (debouncedFilters.ordenMin && tipo.orden < parseInt(debouncedFilters.ordenMin)) {
        return false;
      }
      if (debouncedFilters.ordenMax && tipo.orden > parseInt(debouncedFilters.ordenMax)) {
        return false;
      }

      return true;
    });

    // Ordenar por el campo 'orden'
    filtered.sort((a, b) => (a.orden || 999) - (b.orden || 999));

    setFilteredTipos(filtered);
    setPage(0);
  }, [debouncedFilters, tiposMovimiento]);

  const clearFilters = () => {
    setFilters({
      search: '',
      signo: 'todos',
      requierePrecio: 'todos',
      activo: 'todos',
      ordenMin: '',
      ordenMax: ''
    });
  };

  // Crear nuevo tipo de movimiento
  const createTipoMovimiento = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const tipoData = {
        codigo_tipo: formData.codigo_tipo.trim().toUpperCase(),
        nombre_tipo: formData.nombre_tipo.trim(),
        descripcion: formData.descripcion?.trim() || '',
        signo: formData.signo,
        requiere_precio: formData.requiere_precio,
        activo: formData.activo,
        orden: parseInt(formData.orden) || 999
      };

      console.log('Enviando datos al backend:', tipoData);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(tipoData)
      });
      
      const responseText = await response.text();
      console.log('Respuesta del backend:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Error al crear el tipo de movimiento';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      showSnackbar('Tipo de movimiento creado exitosamente', 'success');
      handleCloseDialog();
      await fetchAllTiposMovimiento();
      
    } catch (error) {
      console.error('Error en createTipoMovimiento:', error);
      showSnackbar(error.message || 'Error al crear el tipo de movimiento', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Actualizar tipo de movimiento
  const updateTipoMovimiento = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const tipoData = {
        codigo_tipo: formData.codigo_tipo.trim().toUpperCase(),
        nombre_tipo: formData.nombre_tipo.trim(),
        descripcion: formData.descripcion?.trim() || '',
        signo: formData.signo,
        requiere_precio: formData.requiere_precio,
        activo: formData.activo,
        orden: parseInt(formData.orden) || 999
      };

      console.log('Actualizando tipo de movimiento:', tipoData);

      const response = await fetch(`${API_URL}${selectedTipo.id_tipo_movimiento}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(tipoData)
      });
      
      const responseText = await response.text();
      console.log('Respuesta del backend:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Error al actualizar el tipo de movimiento';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      showSnackbar('Tipo de movimiento actualizado exitosamente', 'success');
      handleCloseDialog();
      await fetchAllTiposMovimiento();
      
    } catch (error) {
      console.error('Error en updateTipoMovimiento:', error);
      showSnackbar(error.message || 'Error al actualizar el tipo de movimiento', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Eliminar tipo de movimiento
  const deleteTipoMovimiento = async () => {
    setLoadingAction(true);
    try {
      const response = await fetch(`${API_URL}${selectedTipo.id_tipo_movimiento}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al eliminar el tipo de movimiento');
      }
      
      showSnackbar('Tipo de movimiento eliminado exitosamente', 'success');
      setOpenDeleteDialog(false);
      await fetchAllTiposMovimiento();
      
    } catch (error) {
      console.error('Error en deleteTipoMovimiento:', error);
      showSnackbar('Error al eliminar el tipo de movimiento', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Funciones de exportación
  const exportToExcel = () => {
    try {
      const dataToExport = filteredTipos.map(tipo => ({
        ID: tipo.id_tipo_movimiento,
        'Código': tipo.codigo_tipo,
        'Nombre': tipo.nombre_tipo,
        'Descripción': tipo.descripcion,
        'Signo': tipo.signo,
        'Requiere Precio': tipo.requiere_precio ? 'Sí' : 'No',
        'Activo': tipo.activo ? 'Sí' : 'No',
        'Orden': tipo.orden
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'TiposMovimiento');
      XLSX.writeFile(wb, `tipos_movimiento_${new Date().toISOString().split('T')[0]}.xlsx`);
      
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
      
      doc.setFontSize(18);
      doc.text('Catálogo de Tipos de Movimiento', 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, 14, 32);
      
      let filtrosAplicados = [];
      if (filters.search) filtrosAplicados.push(`Búsqueda: "${filters.search}"`);
      if (filters.signo !== 'todos') filtrosAplicados.push(`Signo: ${filters.signo}`);
      if (filters.requierePrecio !== 'todos') filtrosAplicados.push(`Requiere precio: ${filters.requierePrecio === 'si' ? 'Sí' : 'No'}`);
      if (filters.activo !== 'todos') filtrosAplicados.push(`Estado: ${filters.activo}`);
      
      if (filtrosAplicados.length > 0) {
        doc.setFontSize(10);
        doc.text('Filtros aplicados:', 14, 40);
        doc.text(filtrosAplicados.join(' • '), 14, 46);
      }
      
      const tableColumn = ['ID', 'Código', 'Nombre', 'Descripción', 'Signo', 'Req. Precio', 'Estado', 'Orden'];
      const tableRows = filteredTipos.map(tipo => [
        tipo.id_tipo_movimiento,
        tipo.codigo_tipo,
        tipo.nombre_tipo,
        tipo.descripcion || 'N/A',
        tipo.signo,
        tipo.requiere_precio ? 'Sí' : 'No',
        tipo.activo ? 'Activo' : 'Inactivo',
        tipo.orden
      ]);
      
      doc.autoTable({
        startY: filtrosAplicados.length > 0 ? 52 : 38,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [63, 81, 181] }
      });
      
      doc.setFontSize(10);
      doc.text(`Total de registros: ${filteredTipos.length}`, 14, doc.lastAutoTable.finalY + 10);
      
      doc.save(`tipos_movimiento_${new Date().toISOString().split('T')[0]}.pdf`);
      
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
    if (!formData.codigo_tipo?.trim()) {
      errors.codigo_tipo = 'El código es requerido';
    } else if (!/^[A-Za-z0-9_]+$/.test(formData.codigo_tipo.trim())) {
      errors.codigo_tipo = 'Solo letras, números y guión bajo';
    }
    
    if (!formData.nombre_tipo?.trim()) {
      errors.nombre_tipo = 'El nombre es requerido';
    }
    
    if (!formData.orden) {
      errors.orden = 'El orden es requerido';
    } else if (parseInt(formData.orden) <= 0) {
      errors.orden = 'El orden debe ser mayor a 0';
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
    setSelectedTipo(null);
    setFormData({
      codigo_tipo: '',
      nombre_tipo: '',
      descripcion: '',
      signo: '+',
      requiere_precio: false,
      activo: true,
      orden: ''
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (tipo) => {
    setSelectedTipo(tipo);
    setFormData({
      codigo_tipo: tipo.codigo_tipo,
      nombre_tipo: tipo.nombre_tipo,
      descripcion: tipo.descripcion || '',
      signo: tipo.signo,
      requiere_precio: tipo.requiere_precio,
      activo: tipo.activo,
      orden: tipo.orden
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenViewDialog = (tipo) => {
    setSelectedTipo(tipo);
    setOpenViewDialog(true);
  };

  const handleOpenDeleteDialog = (tipo) => {
    setSelectedTipo(tipo);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTipo(null);
    setFormData({
      codigo_tipo: '',
      nombre_tipo: '',
      descripcion: '',
      signo: '+',
      requiere_precio: false,
      activo: true,
      orden: ''
    });
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (selectedTipo) {
      updateTipoMovimiento();
    } else {
      createTipoMovimiento();
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

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
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
    fetchAllTiposMovimiento();
    showSnackbar('Datos actualizados', 'info');
  };

  const handleExportClick = (event) => {
    setAnchorElExport(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setAnchorElExport(null);
  };

  // Obtener datos de la página actual (optimizado con useMemo)
  const currentPageData = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredTipos.slice(start, end);
  }, [filteredTipos, page, rowsPerPage]);

  const hasActiveFilters = useMemo(() => {
    return filters.search || 
           filters.signo !== 'todos' || 
           filters.requierePrecio !== 'todos' || 
           filters.activo !== 'todos' ||
           filters.ordenMin || 
           filters.ordenMax;
  }, [filters]);

  // Calcular estadísticas (optimizado con useMemo)
  const stats = useMemo(() => ({
    total: filteredTipos.length,
    activos: filteredTipos.filter(t => t.activo).length,
    inactivos: filteredTipos.filter(t => !t.activo).length,
    requierePrecio: filteredTipos.filter(t => t.requiere_precio).length,
    noRequierePrecio: filteredTipos.filter(t => !t.requiere_precio).length,
    signoMas: filteredTipos.filter(t => t.signo === '+').length,
    signoMenos: filteredTipos.filter(t => t.signo === '-').length,
    signoMixto: filteredTipos.filter(t => t.signo === '+/-').length
  }), [filteredTipos]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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
                <CategoryIcon />
              </Avatar>
              <Typography variant="h5" component="h1">
                Tipos de Movimiento
              </Typography>
              <Badge
                badgeContent={filteredTipos.length}
                color="primary"
                showZero
                max={9999}
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
                  disabled={filteredTipos.length === 0}
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
                Nuevo Tipo
              </Button>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" variant="body2">En esta página</Typography>
                      <Typography variant="h4">{currentPageData.length}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <CategoryIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card variant="outlined" sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="success.dark" variant="body2">Activos</Typography>
                      <Typography variant="h4" color="success.dark">{stats.activos}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircleIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card variant="outlined" sx={{ bgcolor: 'info.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="info.dark" variant="body2">Requieren Precio</Typography>
                      <Typography variant="h4" color="info.dark">{stats.requierePrecio}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <AssignmentIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" variant="body2">Signo + / - / +/-</Typography>
                      <Typography variant="h6">
                        {stats.signoMas} / {stats.signoMenos} / {stats.signoMixto}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <SwapHorizIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filtros */}
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por código, nombre o descripción..."
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
                  <InputLabel>Signo</InputLabel>
                  <Select
                    value={filters.signo}
                    label="Signo"
                    onChange={(e) => handleFilterChange('signo', e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="+">Positivo (+)</MenuItem>
                    <MenuItem value="-">Negativo (-)</MenuItem>
                    <MenuItem value="+/-">Mixto (+/-)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Requiere Precio</InputLabel>
                  <Select
                    value={filters.requierePrecio}
                    label="Requiere Precio"
                    onChange={(e) => handleFilterChange('requierePrecio', e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="si">Sí</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
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
              
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Orden min"
                    value={filters.ordenMin}
                    onChange={(e) => handleFilterChange('ordenMin', e.target.value)}
                    type="number"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                  <TextField
                    size="small"
                    placeholder="Orden max"
                    value={filters.ordenMax}
                    onChange={(e) => handleFilterChange('ordenMax', e.target.value)}
                    type="number"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Badge
                    color="secondary"
                    variant="dot"
                    invisible={!hasActiveFilters}
                  >
                    <Button
                      size="small"
                      startIcon={<FilterIcon />}
                      color="primary"
                      variant="outlined"
                    >
                      Filtros activos
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Código</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descripción</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Signo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Requiere Precio</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Orden</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                        Cargando todos los tipos de movimiento...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : currentPageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No hay tipos de movimiento disponibles
                      </Typography>
                      {hasActiveFilters && (
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
                        Crear tipo
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageData.map((tipo) => (
                    <TableRow 
                      key={tipo.id_tipo_movimiento}
                      hover
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 },
                        backgroundColor: !tipo.activo ? 'rgba(0, 0, 0, 0.02)' : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={tipo.id_tipo_movimiento} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tipo.codigo_tipo}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LabelIcon fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight="medium">
                            {tipo.nombre_tipo}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={tipo.descripcion || 'Sin descripción'}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {tipo.descripcion || 'Sin descripción'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={`Signo: ${tipo.signo}`}>
                          <Chip
                            icon={getSignoIcon(tipo.signo)}
                            label={tipo.signo}
                            size="small"
                            color={getSignoColor(tipo.signo)}
                            variant="outlined"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={tipo.requiere_precio ? 'Sí' : 'No'}
                          color={tipo.requiere_precio ? 'primary' : 'default'}
                          size="small"
                          variant={tipo.requiere_precio ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={tipo.activo ? 'Activo' : 'Inactivo'}
                          color={tipo.activo ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<SortIcon />}
                          label={tipo.orden}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Ver detalles">
                            <IconButton
                              color="info"
                              onClick={() => handleOpenViewDialog(tipo)}
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenEditDialog(tipo)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDeleteDialog(tipo)}
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
          
          {!loading && filteredTipos.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={filteredTipos.length}
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

        {/* Diálogo de Vista de Detalles */}
        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <CategoryIcon />
              </Avatar>
              <Typography variant="h6">
                Detalles del Tipo de Movimiento: {selectedTipo?.codigo_tipo}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedTipo && (
              <Box>
                {/* Información General */}
                <DetailSection title="Información General">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={CategoryIcon}
                        label="ID"
                        value={selectedTipo.id_tipo_movimiento}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={LabelIcon}
                        label="Código"
                        value={selectedTipo.codigo_tipo}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <DetailItem 
                        icon={DescriptionIcon}
                        label="Nombre"
                        value={selectedTipo.nombre_tipo}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <DetailItem 
                        icon={AssignmentIcon}
                        label="Descripción"
                        value={selectedTipo.descripcion || 'Sin descripción'}
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Configuración */}
                <DetailSection title="Configuración">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <PriorityIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="textSecondary">
                            Signo
                          </Typography>
                        </Box>
                        <Box sx={{ pl: 3.5 }}>
                          <Chip
                            icon={getSignoIcon(selectedTipo.signo)}
                            label={selectedTipo.signo}
                            color={getSignoColor(selectedTipo.signo)}
                          />
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <AssignmentIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="textSecondary">
                            Requiere Precio
                          </Typography>
                        </Box>
                        <Box sx={{ pl: 3.5 }}>
                          <Chip
                            label={selectedTipo.requiere_precio ? 'Sí' : 'No'}
                            color={selectedTipo.requiere_precio ? 'primary' : 'default'}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Estado y Orden */}
                <DetailSection title="Estado y Orden">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CheckCircleIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="textSecondary">
                            Estado
                          </Typography>
                        </Box>
                        <Box sx={{ pl: 3.5 }}>
                          <Chip
                            label={selectedTipo.activo ? 'Activo' : 'Inactivo'}
                            color={selectedTipo.activo ? 'success' : 'default'}
                          />
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={SortIcon}
                        label="Orden"
                        value={selectedTipo.orden}
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
              {selectedTipo ? 'Editar Tipo de Movimiento' : 'Nuevo Tipo de Movimiento'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Código *"
                    name="codigo_tipo"
                    value={formData.codigo_tipo}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={!!formErrors.codigo_tipo}
                    helperText={formErrors.codigo_tipo}
                    disabled={loadingAction}
                    variant="outlined"
                    autoFocus
                    placeholder="Ej: COMPRA"
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Orden *"
                    name="orden"
                    value={formData.orden}
                    onChange={handleNumberChange}
                    fullWidth
                    required
                    type="number"
                    error={!!formErrors.orden}
                    helperText={formErrors.orden}
                    disabled={loadingAction}
                    variant="outlined"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Nombre *"
                name="nombre_tipo"
                value={formData.nombre_tipo}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.nombre_tipo}
                helperText={formErrors.nombre_tipo}
                disabled={loadingAction}
                variant="outlined"
              />

              <TextField
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={loadingAction}
                variant="outlined"
                placeholder="Descripción del tipo de movimiento"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Signo *</InputLabel>
                    <Select
                      name="signo"
                      value={formData.signo}
                      label="Signo *"
                      onChange={handleInputChange}
                      disabled={loadingAction}
                    >
                      <MenuItem value="+">Positivo (+)</MenuItem>
                      <MenuItem value="-">Negativo (-)</MenuItem>
                      <MenuItem value="+/-">Mixto (+/-)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="requiere_precio"
                          checked={formData.requiere_precio}
                          onChange={handleSwitchChange}
                          color="primary"
                          disabled={loadingAction}
                        />
                      }
                      label="Requiere Precio"
                    />
                  </Box>
                </Grid>
              </Grid>

              <FormControlLabel
                control={
                  <Switch
                    name="activo"
                    checked={formData.activo}
                    onChange={handleSwitchChange}
                    color="primary"
                    disabled={loadingAction}
                  />
                }
                label="Activo"
              />
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
              disabled={loadingAction || !formData.codigo_tipo?.trim() || !formData.nombre_tipo?.trim() || !formData.orden}
              startIcon={loadingAction ? <CircularProgress size={20} /> : null}
            >
              {loadingAction ? 'Guardando...' : (selectedTipo ? 'Actualizar' : 'Crear')}
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
              ¿Estás seguro de que deseas eliminar el tipo de movimiento?
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {selectedTipo?.codigo_tipo} - {selectedTipo?.nombre_tipo}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Signo: {selectedTipo?.signo}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Requiere precio: {selectedTipo?.requiere_precio ? 'Sí' : 'No'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Orden: {selectedTipo?.orden}
              </Typography>
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
              onClick={deleteTipoMovimiento} 
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

export default TiposMovimientoCRUD;