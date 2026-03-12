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
  Divider,
  Tooltip,
  Badge,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// Librerías para exportación
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = 'http://127.0.0.1:8000/api/menu-categorias/';

const CategoriasCRUD = () => {
  // Estados para datos
  const [categorias, setCategorias] = useState([]);
  const [filteredCategorias, setFilteredCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    estado: 'todos',
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
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre_categoria: '',
    descripcion_categoria: '',
    activo_categoria: true
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

  // Obtener categorías
  const fetchCategorias = async () => {
    setLoading(true);
    try {
      let nextUrl = API_URL;
      let allCategorias = [];
      let total = 0;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar las categorías');

        const data = await response.json();
        console.log('Datos recibidos:', data);

        if (Array.isArray(data)) {
          allCategorias = data;
          total = data.length;
          break;
        }

        allCategorias = [...allCategorias, ...(data.results || [])];
        total = data.count || allCategorias.length;
        nextUrl = data.next;
      }

      setCategorias(allCategorias);
      setFilteredCategorias(allCategorias);
      setTotalCount(total || allCategorias.length);

    } catch (error) {
      console.error('Error en fetchCategorias:', error);
      showSnackbar('Error al cargar las categorías', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [filters, categorias]);

  const applyFilters = () => {
    let filtered = [...categorias];

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(cat => 
        cat.nombre_categoria.toLowerCase().includes(searchLower) ||
        (cat.descripcion_categoria && cat.descripcion_categoria.toLowerCase().includes(searchLower))
      );
    }

    // Filtro de estado
    if (filters.estado !== 'todos') {
      const estadoValue = filters.estado === 'activo';
      filtered = filtered.filter(cat => cat.activo_categoria === estadoValue);
    }

    // Filtro de fechas
    if (filters.fechaInicio) {
      filtered = filtered.filter(cat => {
        if (!cat.fecha_creacion_categoria) return false;
        const catDate = new Date(cat.fecha_creacion_categoria);
        return catDate >= filters.fechaInicio;
      });
    }

    if (filters.fechaFin) {
      filtered = filtered.filter(cat => {
        if (!cat.fecha_creacion_categoria) return false;
        const catDate = new Date(cat.fecha_creacion_categoria);
        const endDate = new Date(filters.fechaFin);
        endDate.setHours(23, 59, 59, 999);
        return catDate <= endDate;
      });
    }

    setFilteredCategorias(filtered);
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      estado: 'todos',
      fechaInicio: null,
      fechaFin: null
    });
  };

  const getFilteredCount = () => {
    return filteredCategorias.length;
  };

  // Crear nueva categoría
  const createCategoria = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const categoriaData = {
        nombre_categoria: formData.nombre_categoria,
        descripcion_categoria: formData.descripcion_categoria || '',
        activo_categoria: formData.activo_categoria
        // NO enviamos fecha_creacion_categoria porque debe ser manejada por el backend
      };

      console.log('Enviando datos al backend:', categoriaData);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(categoriaData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Error al crear la categoría');
      }
      
      const newCategoria = await response.json();
      console.log('Respuesta del backend:', newCategoria);
      
      showSnackbar('Categoría creada exitosamente', 'success');
      handleCloseDialog();
      
      // Recargar datos para obtener la fecha asignada por el backend
      await fetchCategorias();
      
    } catch (error) {
      console.error('Error en createCategoria:', error);
      showSnackbar(error.message || 'Error al crear la categoría', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Actualizar categoría
  const updateCategoria = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const categoriaData = {
        id_categoria: selectedCategoria.id_categoria,
        nombre_categoria: formData.nombre_categoria,
        descripcion_categoria: formData.descripcion_categoria || '',
        activo_categoria: formData.activo_categoria
      };

      console.log('Actualizando categoría:', categoriaData);

      const response = await fetch(`${API_URL}${selectedCategoria.id_categoria}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(categoriaData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la categoría');
      }
      
      const updatedCategoria = await response.json();
      console.log('Categoría actualizada:', updatedCategoria);
      
      showSnackbar('Categoría actualizada exitosamente', 'success');
      handleCloseDialog();
      
      // Recargar datos
      await fetchCategorias();
      
    } catch (error) {
      console.error('Error en updateCategoria:', error);
      showSnackbar(error.message || 'Error al actualizar la categoría', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Eliminar categoría
  const deleteCategoria = async () => {
    setLoadingAction(true);
    try {
      const response = await fetch(`${API_URL}${selectedCategoria.id_categoria}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar la categoría');
      }
      
      showSnackbar('Categoría eliminada exitosamente', 'success');
      setOpenDeleteDialog(false);
      
      // Recargar datos
      await fetchCategorias();
      
    } catch (error) {
      console.error('Error en deleteCategoria:', error);
      showSnackbar('Error al eliminar la categoría', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Funciones de exportación
  const exportToExcel = () => {
    try {
      const dataToExport = filteredCategorias.map(cat => ({
        ID: cat.id_categoria,
        Nombre: cat.nombre_categoria,
        Descripción: cat.descripcion_categoria || '',
        Estado: cat.activo_categoria ? 'Activo' : 'Inactivo',
        'Fecha Creación': formatDate(cat.fecha_creacion_categoria)
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Categorías');
      XLSX.writeFile(wb, `categorias_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showSnackbar('Archivo Excel exportado exitosamente', 'success');
      handleCloseExportMenu();
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      showSnackbar('Error al exportar a Excel', 'error');
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text('Listado de Categorías', 14, 22);
      
      // Subtítulo con fecha
      doc.setFontSize(11);
      doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, 14, 32);
      
      // Información de filtros
      let filtrosAplicados = [];
      if (filters.search) filtrosAplicados.push(`Búsqueda: "${filters.search}"`);
      if (filters.estado !== 'todos') filtrosAplicados.push(`Estado: ${filters.estado}`);
      if (filters.fechaInicio) filtrosAplicados.push(`Desde: ${filters.fechaInicio.toLocaleDateString()}`);
      if (filters.fechaFin) filtrosAplicados.push(`Hasta: ${filters.fechaFin.toLocaleDateString()}`);
      
      if (filtrosAplicados.length > 0) {
        doc.setFontSize(10);
        doc.text('Filtros aplicados:', 14, 40);
        doc.text(filtrosAplicados.join(' • '), 14, 46);
      }
      
      // Datos para la tabla
      const tableColumn = ['ID', 'Nombre', 'Descripción', 'Estado', 'Fecha Creación'];
      const tableRows = filteredCategorias.map(cat => [
        cat.id_categoria,
        cat.nombre_categoria,
        cat.descripcion_categoria || '-',
        cat.activo_categoria ? 'Activo' : 'Inactivo',
        formatDate(cat.fecha_creacion_categoria)
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
      doc.text(`Total de registros: ${filteredCategorias.length}`, 14, doc.lastAutoTable.finalY + 10);
      
      doc.save(`categorias_${new Date().toISOString().split('T')[0]}.pdf`);
      
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
    if (!formData.nombre_categoria?.trim()) {
      errors.nombre_categoria = 'El nombre de la categoría es requerido';
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
    setSelectedCategoria(null);
    setFormData({
      nombre_categoria: '',
      descripcion_categoria: '',
      activo_categoria: true
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (categoria) => {
    setSelectedCategoria(categoria);
    setFormData({
      nombre_categoria: categoria.nombre_categoria,
      descripcion_categoria: categoria.descripcion_categoria || '',
      activo_categoria: categoria.activo_categoria
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenDeleteDialog = (categoria) => {
    setSelectedCategoria(categoria);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategoria(null);
    setFormData({
      nombre_categoria: '',
      descripcion_categoria: '',
      activo_categoria: true
    });
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (selectedCategoria) {
      updateCategoria();
    } else {
      createCategoria();
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
      activo_categoria: e.target.checked
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

  const handleRefresh = () => {
    clearFilters();
    fetchCategorias();
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
    return filteredCategorias.slice(start, end);
  };

  const currentPageData = getCurrentPageData();

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
                <CategoryIcon />
              </Avatar>
              <Typography variant="h5" component="h1">
                Gestión de Categorías
              </Typography>
              <Badge
                badgeContent={filteredCategorias.length}
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
                  disabled={filteredCategorias.length === 0}
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
                Nueva Categoría
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
                  placeholder="Buscar por nombre o descripción..."
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
                    value={filters.estado}
                    label="Estado"
                    onChange={(e) => handleFilterChange('estado', e.target.value)}
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
                    invisible={!filters.search && filters.estado === 'todos' && !filters.fechaInicio && !filters.fechaFin}
                  >
                    <Button
                      size="small"
                      startIcon={<FilterIcon />}
                      onClick={() => setOpenFilters(!openFilters)}
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Descripción</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Creación</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                        Cargando categorías...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : currentPageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <CategoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No hay categorías disponibles
                      </Typography>
                      {(filters.search || filters.estado !== 'todos' || filters.fechaInicio || filters.fechaFin) && (
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
                        Crear categoría
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageData.map((categoria) => (
                    <TableRow 
                      key={categoria.id_categoria}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Chip 
                          label={categoria.id_categoria} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {categoria.nombre_categoria}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {categoria.descripcion_categoria || 'Sin descripción'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={categoria.activo_categoria ? 'Activo' : 'Inactivo'}
                          color={categoria.activo_categoria ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {!categoria.fecha_creacion_categoria && (
                            <Tooltip title="Fecha no disponible en BD">
                              <WarningIcon color="warning" fontSize="small" />
                            </Tooltip>
                          )}
                          <Typography variant="body2">
                            {formatDate(categoria.fecha_creacion_categoria)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenEditDialog(categoria)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            onClick={() => handleOpenDeleteDialog(categoria)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {!loading && filteredCategorias.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredCategorias.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              showFirstButton
              showLastButton
            />
          )}
        </Paper>

        {/* Diálogo para Crear/Editar */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          disableEscapeKeyDown={loadingAction}
        >
          <DialogTitle>
            <Typography variant="h6">
              {selectedCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Nombre de la categoría *"
                name="nombre_categoria"
                value={formData.nombre_categoria}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.nombre_categoria}
                helperText={formErrors.nombre_categoria}
                disabled={loadingAction}
                variant="outlined"
                autoFocus
              />
              <TextField
                label="Descripción"
                name="descripcion_categoria"
                value={formData.descripcion_categoria}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                disabled={loadingAction}
                variant="outlined"
                placeholder="Descripción opcional de la categoría"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo_categoria}
                    onChange={handleSwitchChange}
                    color="primary"
                    disabled={loadingAction}
                  />
                }
                label="Categoría activa"
              />
              
              {!selectedCategoria && (
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
              disabled={loadingAction || !formData.nombre_categoria?.trim()}
              startIcon={loadingAction ? <CircularProgress size={20} /> : null}
            >
              {loadingAction ? 'Guardando...' : (selectedCategoria ? 'Actualizar' : 'Crear')}
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
              ¿Estás seguro de que deseas eliminar la categoría?
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {selectedCategoria?.nombre_categoria}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedCategoria?.descripcion_categoria || 'Sin descripción'}
              </Typography>
              {selectedCategoria?.fecha_creacion_categoria && (
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  Creada: {formatDate(selectedCategoria.fecha_creacion_categoria)}
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
              onClick={deleteCategoria} 
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

export default CategoriasCRUD;