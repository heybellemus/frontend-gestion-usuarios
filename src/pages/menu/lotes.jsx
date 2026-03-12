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
  LinearProgress,
  Divider,
  Paper as MuiPaper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Visibility as VisibilityIcon,
  Inventory as ProductIcon,
  Business as BusinessIcon,
  Event as EventIcon,
  AttachMoney as MoneyIcon,
  Percent as PercentIcon,
  Warehouse as WarehouseIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  Category as CategoryIcon,
  Numbers as NumbersIcon,
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

const API_URL = 'http://127.0.0.1:8000/api/menu-lotes/';
const PRODUCTOS_URL = 'http://127.0.0.1:8000/api/menu-productos/';
const PROVEEDORES_URL = 'http://127.0.0.1:8000/api/menu-proveedores/';

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

const LotesCRUD = () => {
  // Estados para datos
  const [lotes, setLotes] = useState([]);
  const [filteredLotes, setFilteredLotes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Estados para paginación (cliente-side optimizada)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados para filtros optimizados
  const [filters, setFilters] = useState({
    search: '',
    producto: 'todos',
    proveedor: 'todos',
    estado: 'todos',
    vencidos: false,
    stockBajo: false,
    fechaInicio: null,
    fechaFin: null
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
  const [selectedLote, setSelectedLote] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    numero_lote: '',
    cantidad_recibida_lote: '',
    cantidad_disponible_lote: '',
    precio_compra_lote: '',
    precio_venta_lote: '',
    fecha_vencimiento_lote: '',
    id_proveedor: '',
    activo_lote: true,
    observaciones_lote: '',
    id_producto: ''
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

  // Función para obtener TODOS los lotes (manejando paginación)
  const fetchAllLotes = async () => {
    setLoading(true);
    try {
      let allLotes = [];
      let nextUrl = API_URL;
      let total = 0;
      let pageCount = 0;

      showSnackbar('Cargando todos los lotes...', 'info');

      while (nextUrl) {
        pageCount++;
        console.log(`Cargando página ${pageCount} de lotes...`);
        
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar los lotes');

        const data = await response.json();
        allLotes = [...allLotes, ...(data.results || [])];
        total = data.count || allLotes.length;
        nextUrl = data.next;
      }

      console.log(`Total de lotes cargados: ${allLotes.length} de ${total} (${pageCount} páginas)`);

      // Enriquecer datos con nombres de producto y proveedor
      const enrichedData = allLotes.map(lote => ({
        ...lote,
        producto_nombre: getProductoNombre(lote.id_producto),
        proveedor_nombre: getProveedorNombre(lote.id_proveedor)
      }));

      setLotes(enrichedData);
      setFilteredLotes(enrichedData);
      setTotalCount(enrichedData.length);

      showSnackbar(`${enrichedData.length} lotes cargados exitosamente`, 'success');

    } catch (error) {
      console.error('Error en fetchAllLotes:', error);
      showSnackbar('Error al cargar los lotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener productos
  const fetchProductos = async () => {
    try {
      let allProductos = [];
      let nextUrl = PRODUCTOS_URL;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar los productos');

        const data = await response.json();
        allProductos = [...allProductos, ...(data.results || [])];
        nextUrl = data.next;
      }

      setProductos(allProductos);
    } catch (error) {
      console.error('Error en fetchProductos:', error);
    }
  };

  // Función para obtener proveedores
  const fetchProveedores = async () => {
    try {
      let allProveedores = [];
      let nextUrl = PROVEEDORES_URL;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar los proveedores');

        const data = await response.json();
        allProveedores = [...allProveedores, ...(data.results || [])];
        nextUrl = data.next;
      }

      setProveedores(allProveedores);
    } catch (error) {
      console.error('Error en fetchProveedores:', error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchProductos(),
        fetchProveedores(),
        fetchAllLotes()
      ]);
    };
    loadInitialData();
  }, []);

  // Debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  // Aplicar filtros optimizados con useMemo
  useEffect(() => {
    applyFilters();
  }, [debouncedFilters, lotes]);

  const getProductoNombre = useCallback((id) => {
    const producto = productos.find(p => p.id_producto === id);
    return producto ? producto.nombre_producto : id;
  }, [productos]);

  const getProveedorNombre = useCallback((id) => {
    const proveedor = proveedores.find(p => p.id_proveedor === id);
    return proveedor ? proveedor.nombre_comercial : 'Proveedor no asignado';
  }, [proveedores]);

  const getStockStatus = useCallback((lote) => {
    if (lote.cantidad_disponible_lote <= 0) return 'sin_stock';
    if (lote.cantidad_disponible_lote < lote.cantidad_recibida_lote * 0.2) return 'bajo';
    return 'normal';
  }, []);

  const getStockStatusColor = useCallback((status) => {
    switch(status) {
      case 'sin_stock': return 'error';
      case 'bajo': return 'warning';
      default: return 'success';
    }
  }, []);

  const isVencido = useCallback((fecha) => {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  }, []);

  // Función de filtrado optimizada
  const applyFilters = useCallback(() => {
    const filtered = lotes.filter(lote => {
      // Filtro de búsqueda
      if (debouncedFilters.search) {
        const searchLower = debouncedFilters.search.toLowerCase();
        const matchesSearch = 
          lote.numero_lote?.toLowerCase().includes(searchLower) ||
          getProductoNombre(lote.id_producto)?.toLowerCase().includes(searchLower) ||
          getProveedorNombre(lote.id_proveedor)?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro de producto
      if (debouncedFilters.producto !== 'todos' && 
          lote.id_producto !== parseInt(debouncedFilters.producto)) {
        return false;
      }

      // Filtro de proveedor
      if (debouncedFilters.proveedor !== 'todos' && 
          lote.id_proveedor !== parseInt(debouncedFilters.proveedor)) {
        return false;
      }

      // Filtro de estado
      if (debouncedFilters.estado !== 'todos') {
        const estadoValue = debouncedFilters.estado === 'activo';
        if (lote.activo_lote !== estadoValue) return false;
      }

      // Filtro de vencidos
      if (debouncedFilters.vencidos && !isVencido(lote.fecha_vencimiento_lote)) {
        return false;
      }

      // Filtro de stock bajo
      if (debouncedFilters.stockBajo) {
        const porcentaje = (lote.cantidad_disponible_lote / lote.cantidad_recibida_lote) * 100;
        if (porcentaje >= 20 || lote.cantidad_disponible_lote <= 0) return false;
      }

      // Filtro de fechas
      if (debouncedFilters.fechaInicio && lote.fecha_ingreso_lote) {
        const loteDate = new Date(lote.fecha_ingreso_lote);
        if (loteDate < debouncedFilters.fechaInicio) return false;
      }

      if (debouncedFilters.fechaFin && lote.fecha_ingreso_lote) {
        const loteDate = new Date(lote.fecha_ingreso_lote);
        const endDate = new Date(debouncedFilters.fechaFin);
        endDate.setHours(23, 59, 59, 999);
        if (loteDate > endDate) return false;
      }

      return true;
    });

    setFilteredLotes(filtered);
    setPage(0);
  }, [debouncedFilters, lotes, getProductoNombre, getProveedorNombre, isVencido]);

  const clearFilters = () => {
    setFilters({
      search: '',
      producto: 'todos',
      proveedor: 'todos',
      estado: 'todos',
      vencidos: false,
      stockBajo: false,
      fechaInicio: null,
      fechaFin: null
    });
  };

  // Crear nuevo lote
  const createLote = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const loteData = {
        numero_lote: formData.numero_lote.trim(),
        cantidad_recibida_lote: parseInt(formData.cantidad_recibida_lote) || 0,
        cantidad_disponible_lote: parseInt(formData.cantidad_recibida_lote) || 0,
        precio_compra_lote: parseFloat(formData.precio_compra_lote) || 0,
        precio_venta_lote: parseFloat(formData.precio_venta_lote) || 0,
        fecha_vencimiento_lote: formData.fecha_vencimiento_lote || null,
        id_proveedor: formData.id_proveedor ? parseInt(formData.id_proveedor) : null,
        activo_lote: formData.activo_lote,
        observaciones_lote: formData.observaciones_lote?.trim() || null,
        id_producto: parseInt(formData.id_producto)
      };

      console.log('Enviando datos al backend:', loteData);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(loteData)
      });
      
      const responseText = await response.text();
      console.log('Respuesta del backend:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Error al crear el lote';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      showSnackbar('Lote creado exitosamente', 'success');
      handleCloseDialog();
      await fetchAllLotes();
      
    } catch (error) {
      console.error('Error en createLote:', error);
      showSnackbar(error.message || 'Error al crear el lote', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Actualizar lote
  const updateLote = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const loteData = {
        numero_lote: formData.numero_lote.trim(),
        cantidad_recibida_lote: parseInt(formData.cantidad_recibida_lote) || 0,
        cantidad_disponible_lote: parseInt(formData.cantidad_disponible_lote) || 0,
        precio_compra_lote: parseFloat(formData.precio_compra_lote) || 0,
        precio_venta_lote: parseFloat(formData.precio_venta_lote) || 0,
        fecha_vencimiento_lote: formData.fecha_vencimiento_lote || null,
        id_proveedor: formData.id_proveedor ? parseInt(formData.id_proveedor) : null,
        activo_lote: formData.activo_lote,
        observaciones_lote: formData.observaciones_lote?.trim() || null,
        id_producto: parseInt(formData.id_producto)
      };

      console.log('Actualizando lote:', loteData);

      const response = await fetch(`${API_URL}${selectedLote.id_lote}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(loteData)
      });
      
      const responseText = await response.text();
      console.log('Respuesta del backend:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Error al actualizar el lote';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      showSnackbar('Lote actualizado exitosamente', 'success');
      handleCloseDialog();
      await fetchAllLotes();
      
    } catch (error) {
      console.error('Error en updateLote:', error);
      showSnackbar(error.message || 'Error al actualizar el lote', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Eliminar lote
  const deleteLote = async () => {
    setLoadingAction(true);
    try {
      const response = await fetch(`${API_URL}${selectedLote.id_lote}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al eliminar el lote');
      }
      
      showSnackbar('Lote eliminado exitosamente', 'success');
      setOpenDeleteDialog(false);
      await fetchAllLotes();
      
    } catch (error) {
      console.error('Error en deleteLote:', error);
      showSnackbar('Error al eliminar el lote', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Funciones de exportación
  const exportToExcel = () => {
    try {
      const dataToExport = filteredLotes.map(lote => ({
        ID: lote.id_lote,
        'Número de Lote': lote.numero_lote,
        Producto: getProductoNombre(lote.id_producto),
        Proveedor: getProveedorNombre(lote.id_proveedor),
        'Cant. Recibida': lote.cantidad_recibida_lote,
        'Cant. Disponible': lote.cantidad_disponible_lote,
        'Precio Compra': parseFloat(lote.precio_compra_lote).toFixed(2),
        'Precio Venta': parseFloat(lote.precio_venta_lote).toFixed(2),
        'Ganancia %': lote.ganancia_formateada || '0%',
        'Fecha Vencimiento': lote.fecha_vencimiento_lote ? new Date(lote.fecha_vencimiento_lote).toLocaleDateString() : 'N/A',
        'Fecha Ingreso': formatDate(lote.fecha_ingreso_lote),
        Estado: lote.activo_lote ? 'Activo' : 'Inactivo',
        Observaciones: lote.observaciones_lote || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lotes');
      XLSX.writeFile(wb, `lotes_${new Date().toISOString().split('T')[0]}.xlsx`);
      
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
      doc.text('Listado de Lotes', 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, 14, 32);
      
      let filtrosAplicados = [];
      if (filters.search) filtrosAplicados.push(`Búsqueda: "${filters.search}"`);
      if (filters.producto !== 'todos') filtrosAplicados.push(`Producto: ${getProductoNombre(parseInt(filters.producto))}`);
      if (filters.proveedor !== 'todos') filtrosAplicados.push(`Proveedor: ${getProveedorNombre(parseInt(filters.proveedor))}`);
      if (filters.estado !== 'todos') filtrosAplicados.push(`Estado: ${filters.estado}`);
      if (filters.vencidos) filtrosAplicados.push('Solo vencidos');
      if (filters.stockBajo) filtrosAplicados.push('Stock bajo');
      
      if (filtrosAplicados.length > 0) {
        doc.setFontSize(10);
        doc.text('Filtros aplicados:', 14, 40);
        doc.text(filtrosAplicados.join(' • '), 14, 46);
      }
      
      const tableColumn = ['ID', 'N° Lote', 'Producto', 'Proveedor', 'Recibido', 'Disponible', 'Compra', 'Venta', 'Vencimiento', 'Estado'];
      const tableRows = filteredLotes.map(lote => [
        lote.id_lote,
        lote.numero_lote,
        getProductoNombre(lote.id_producto),
        getProveedorNombre(lote.id_proveedor),
        lote.cantidad_recibida_lote,
        lote.cantidad_disponible_lote,
        `$${parseFloat(lote.precio_compra_lote).toFixed(2)}`,
        `$${parseFloat(lote.precio_venta_lote).toFixed(2)}`,
        lote.fecha_vencimiento_lote ? new Date(lote.fecha_vencimiento_lote).toLocaleDateString() : 'N/A',
        lote.activo_lote ? 'Activo' : 'Inactivo'
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
      doc.text(`Total de registros: ${filteredLotes.length}`, 14, doc.lastAutoTable.finalY + 10);
      
      doc.save(`lotes_${new Date().toISOString().split('T')[0]}.pdf`);
      
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
    if (!formData.numero_lote?.trim()) {
      errors.numero_lote = 'El número de lote es requerido';
    }
    if (!formData.id_producto) {
      errors.id_producto = 'El producto es requerido';
    }
    if (!formData.cantidad_recibida_lote || parseInt(formData.cantidad_recibida_lote) <= 0) {
      errors.cantidad_recibida_lote = 'La cantidad recibida debe ser mayor a 0';
    }
    if (!formData.precio_compra_lote || parseFloat(formData.precio_compra_lote) <= 0) {
      errors.precio_compra_lote = 'El precio de compra debe ser mayor a 0';
    }
    if (!formData.precio_venta_lote || parseFloat(formData.precio_venta_lote) <= 0) {
      errors.precio_venta_lote = 'El precio de venta debe ser mayor a 0';
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
    setSelectedLote(null);
    setFormData({
      numero_lote: '',
      cantidad_recibida_lote: '',
      cantidad_disponible_lote: '',
      precio_compra_lote: '',
      precio_venta_lote: '',
      fecha_vencimiento_lote: '',
      id_proveedor: '',
      activo_lote: true,
      observaciones_lote: '',
      id_producto: ''
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (lote) => {
    setSelectedLote(lote);
    setFormData({
      numero_lote: lote.numero_lote,
      cantidad_recibida_lote: lote.cantidad_recibida_lote,
      cantidad_disponible_lote: lote.cantidad_disponible_lote,
      precio_compra_lote: lote.precio_compra_lote,
      precio_venta_lote: lote.precio_venta_lote,
      fecha_vencimiento_lote: lote.fecha_vencimiento_lote || '',
      id_proveedor: lote.id_proveedor || '',
      activo_lote: lote.activo_lote,
      observaciones_lote: lote.observaciones_lote || '',
      id_producto: lote.id_producto
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenViewDialog = (lote) => {
    setSelectedLote(lote);
    setOpenViewDialog(true);
  };

  const handleOpenDeleteDialog = (lote) => {
    setSelectedLote(lote);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLote(null);
    setFormData({
      numero_lote: '',
      cantidad_recibida_lote: '',
      cantidad_disponible_lote: '',
      precio_compra_lote: '',
      precio_venta_lote: '',
      fecha_vencimiento_lote: '',
      id_proveedor: '',
      activo_lote: true,
      observaciones_lote: '',
      id_producto: ''
    });
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (selectedLote) {
      updateLote();
    } else {
      createLote();
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
    const numericValue = value.replace(/[^0-9.]/g, '');
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
    setFormData(prev => ({
      ...prev,
      activo_lote: e.target.checked
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
    fetchAllLotes();
    showSnackbar('Datos actualizados', 'info');
  };

  const handleExportClick = (event) => {
    setAnchorElExport(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setAnchorElExport(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Inválida';
    }
  };

  // Obtener datos de la página actual (optimizado con useMemo)
  const currentPageData = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredLotes.slice(start, end);
  }, [filteredLotes, page, rowsPerPage]);

  const hasActiveFilters = useMemo(() => {
    return filters.search || 
           filters.producto !== 'todos' || 
           filters.proveedor !== 'todos' || 
           filters.estado !== 'todos' || 
           filters.vencidos ||
           filters.stockBajo ||
           filters.fechaInicio || 
           filters.fechaFin;
  }, [filters]);

  // Calcular estadísticas (optimizado con useMemo)
  const stats = useMemo(() => ({
    total: filteredLotes.length,
    stockBajo: filteredLotes.filter(l => {
      const porcentaje = (l.cantidad_disponible_lote / l.cantidad_recibida_lote) * 100;
      return porcentaje < 20 && l.cantidad_disponible_lote > 0;
    }).length,
    vencidos: filteredLotes.filter(l => l.fecha_vencimiento_lote && isVencido(l.fecha_vencimiento_lote)).length,
    sinStock: filteredLotes.filter(l => l.cantidad_disponible_lote <= 0).length
  }), [filteredLotes, isVencido]);

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
                <WarehouseIcon />
              </Avatar>
              <Typography variant="h5" component="h1">
                Gestión de Lotes
              </Typography>
              <Badge
                badgeContent={filteredLotes.length}
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
                  disabled={filteredLotes.length === 0}
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
                Nuevo Lote
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
                      <WarehouseIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card variant="outlined" sx={{ bgcolor: 'warning.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="warning.dark" variant="body2">Stock Bajo</Typography>
                      <Typography variant="h4" color="warning.dark">{stats.stockBajo}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <WarningIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Card variant="outlined" sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="error.dark" variant="body2">Vencidos</Typography>
                      <Typography variant="h4" color="error.dark">{stats.vencidos}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <EventIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Card variant="outlined" sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="error.dark" variant="body2">Sin Stock</Typography>
                      <Typography variant="h4" color="error.dark">{stats.sinStock}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <ErrorIcon />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filtros */}
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por lote, producto o proveedor..."
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
                  <InputLabel>Producto</InputLabel>
                  <Select
                    value={filters.producto}
                    label="Producto"
                    onChange={(e) => handleFilterChange('producto', e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    {productos.map(prod => (
                      <MenuItem key={prod.id_producto} value={prod.id_producto}>
                        {prod.nombre_producto}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Proveedor</InputLabel>
                  <Select
                    value={filters.proveedor}
                    label="Proveedor"
                    onChange={(e) => handleFilterChange('proveedor', e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    {proveedores.map(prov => (
                      <MenuItem key={prov.id_proveedor} value={prov.id_proveedor}>
                        {prov.nombre_comercial}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.vencidos}
                        onChange={(e) => handleFilterChange('vencidos', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Vencidos"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={filters.stockBajo}
                        onChange={(e) => handleFilterChange('stockBajo', e.target.checked)}
                        size="small"
                      />
                    }
                    label="Stock bajo"
                  />
                </Box>
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
              
              <Grid item xs={12} md={6}>
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>N° Lote</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Producto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Proveedor</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Recibido</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Disponible</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">P. Compra</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">P. Venta</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vencimiento</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                        Cargando todos los lotes...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : currentPageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                      <WarehouseIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No hay lotes disponibles
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
                        Crear lote
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageData.map((lote) => {
                    const stockStatus = getStockStatus(lote);
                    const stockColor = getStockStatusColor(stockStatus);
                    const vencido = isVencido(lote.fecha_vencimiento_lote);
                    
                    return (
                      <TableRow 
                        key={lote.id_lote}
                        hover
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          backgroundColor: vencido ? 'rgba(239, 83, 80, 0.05)' : 
                                         stockStatus === 'bajo' ? 'rgba(255, 193, 7, 0.05)' : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={lote.id_lote} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lote.numero_lote}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ProductIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {getProductoNombre(lote.id_producto)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon fontSize="small" color="action" />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {getProveedorNombre(lote.id_proveedor)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {lote.cantidad_recibida_lote}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title={`Disponible: ${lote.cantidad_disponible_lote} de ${lote.cantidad_recibida_lote}`}>
                              <Chip
                                label={lote.cantidad_disponible_lote}
                                size="small"
                                color={stockColor}
                              />
                            </Tooltip>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((lote.cantidad_disponible_lote / lote.cantidad_recibida_lote) * 100, 100)}
                              color={stockColor}
                              sx={{ width: 50, height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${parseFloat(lote.precio_compra_lote).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            ${parseFloat(lote.precio_venta_lote).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {lote.fecha_vencimiento_lote ? (
                            <Tooltip title={vencido ? 'Vencido' : 'Válido'}>
                              <Chip
                                icon={vencido ? <ErrorIcon /> : <CheckCircleIcon />}
                                label={formatDateShort(lote.fecha_vencimiento_lote)}
                                size="small"
                                color={vencido ? 'error' : 'success'}
                                variant="outlined"
                              />
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Sin vencimiento
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lote.activo_lote ? 'Activo' : 'Inactivo'}
                            color={lote.activo_lote ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Ver detalles">
                              <IconButton
                                color="info"
                                onClick={() => handleOpenViewDialog(lote)}
                                size="small"
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenEditDialog(lote)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                color="error"
                                onClick={() => handleOpenDeleteDialog(lote)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {!loading && filteredLotes.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={filteredLotes.length}
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

        {/* Diálogo de Vista de Detalles - Organizado verticalmente */}
        <Dialog 
          open={openViewDialog} 
          onClose={() => setOpenViewDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <WarehouseIcon />
              </Avatar>
              <Typography variant="h6">
                Detalles del Lote: {selectedLote?.numero_lote}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedLote && (
              <Box>
                {/* Información General */}
                <DetailSection title="Información General">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={NumbersIcon}
                        label="ID del Lote"
                        value={selectedLote.id_lote}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={AssignmentIcon}
                        label="Número de Lote"
                        value={selectedLote.numero_lote}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={ProductIcon}
                        label="Producto"
                        value={getProductoNombre(selectedLote.id_producto)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={BusinessIcon}
                        label="Proveedor"
                        value={getProveedorNombre(selectedLote.id_proveedor)}
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Cantidades y Stock */}
                <DetailSection title="Cantidades y Stock">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <DetailItem 
                        icon={NumbersIcon}
                        label="Cantidad Recibida"
                        value={selectedLote.cantidad_recibida_lote}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <DetailItem 
                        icon={NumbersIcon}
                        label="Cantidad Disponible"
                        value={selectedLote.cantidad_disponible_lote}
                        color={
                          selectedLote.cantidad_disponible_lote <= 0 ? 'error.main' :
                          (selectedLote.cantidad_disponible_lote / selectedLote.cantidad_recibida_lote) < 0.2 ? 'warning.main' : 'success.main'
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <PercentIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="textSecondary">
                            Porcentaje Disponible
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 3.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((selectedLote.cantidad_disponible_lote / selectedLote.cantidad_recibida_lote) * 100, 100)}
                            color={
                              selectedLote.cantidad_disponible_lote <= 0 ? 'error' :
                              (selectedLote.cantidad_disponible_lote / selectedLote.cantidad_recibida_lote) < 0.2 ? 'warning' : 'success'
                            }
                            sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2">
                            {((selectedLote.cantidad_disponible_lote / selectedLote.cantidad_recibida_lote) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Precios y Rentabilidad */}
                <DetailSection title="Precios y Rentabilidad">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <DetailItem 
                        icon={MoneyIcon}
                        label="Precio de Compra"
                        value={`$${parseFloat(selectedLote.precio_compra_lote).toFixed(2)}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <DetailItem 
                        icon={MoneyIcon}
                        label="Precio de Venta"
                        value={`$${parseFloat(selectedLote.precio_venta_lote).toFixed(2)}`}
                        color="primary.main"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <DetailItem 
                        icon={PercentIcon}
                        label="Ganancia"
                        value={selectedLote.ganancia_formateada || '0%'}
                        color="success.main"
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Fechas */}
                <DetailSection title="Fechas">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <EventIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="textSecondary">
                            Fecha de Vencimiento
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 3.5 }}>
                          {selectedLote.fecha_vencimiento_lote ? (
                            <>
                              {isVencido(selectedLote.fecha_vencimiento_lote) ? (
                                <ErrorIcon color="error" fontSize="small" />
                              ) : (
                                <CheckCircleIcon color="success" fontSize="small" />
                              )}
                              <Typography 
                                variant="body1" 
                                color={isVencido(selectedLote.fecha_vencimiento_lote) ? 'error' : 'textPrimary'}
                              >
                                {formatDate(selectedLote.fecha_vencimiento_lote)}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body1" color="textSecondary">
                              Sin fecha de vencimiento
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={DateRangeIcon}
                        label="Fecha de Ingreso"
                        value={formatDate(selectedLote.fecha_ingreso_lote)}
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Estado y Observaciones */}
                <DetailSection title="Estado y Observaciones">
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
                            label={selectedLote.activo_lote ? 'Activo' : 'Inactivo'}
                            color={selectedLote.activo_lote ? 'success' : 'default'}
                          />
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <DetailItem 
                        icon={AssignmentIcon}
                        label="Observaciones"
                        value={selectedLote.observaciones_lote || 'Sin observaciones'}
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
              {selectedLote ? 'Editar Lote' : 'Nuevo Lote'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Número de Lote *"
                name="numero_lote"
                value={formData.numero_lote}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!formErrors.numero_lote}
                helperText={formErrors.numero_lote}
                disabled={loadingAction}
                variant="outlined"
                autoFocus
                placeholder="Ej: L2024-001"
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" error={!!formErrors.id_producto}>
                    <InputLabel>Producto *</InputLabel>
                    <Select
                      name="id_producto"
                      value={formData.id_producto}
                      label="Producto *"
                      onChange={handleInputChange}
                      disabled={loadingAction}
                    >
                      {productos.map(prod => (
                        <MenuItem key={prod.id_producto} value={prod.id_producto}>
                          {prod.nombre_producto}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.id_producto && (
                      <FormHelperText>{formErrors.id_producto}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Proveedor</InputLabel>
                    <Select
                      name="id_proveedor"
                      value={formData.id_proveedor}
                      label="Proveedor"
                      onChange={handleInputChange}
                      disabled={loadingAction}
                    >
                      <MenuItem value="">Sin proveedor</MenuItem>
                      {proveedores.map(prov => (
                        <MenuItem key={prov.id_proveedor} value={prov.id_proveedor}>
                          {prov.nombre_comercial}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cantidad Recibida *"
                    name="cantidad_recibida_lote"
                    value={formData.cantidad_recibida_lote}
                    onChange={handleNumberChange}
                    fullWidth
                    required
                    type="number"
                    error={!!formErrors.cantidad_recibida_lote}
                    helperText={formErrors.cantidad_recibida_lote}
                    disabled={loadingAction}
                    size="small"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                {selectedLote && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Cantidad Disponible"
                      name="cantidad_disponible_lote"
                      value={formData.cantidad_disponible_lote}
                      onChange={handleNumberChange}
                      fullWidth
                      type="number"
                      disabled={loadingAction}
                      size="small"
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                )}
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Precio de Compra *"
                    name="precio_compra_lote"
                    value={formData.precio_compra_lote}
                    onChange={handleNumberChange}
                    fullWidth
                    required
                    type="number"
                    error={!!formErrors.precio_compra_lote}
                    helperText={formErrors.precio_compra_lote}
                    disabled={loadingAction}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0.01, step: 0.01 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Precio de Venta *"
                    name="precio_venta_lote"
                    value={formData.precio_venta_lote}
                    onChange={handleNumberChange}
                    fullWidth
                    required
                    type="number"
                    error={!!formErrors.precio_venta_lote}
                    helperText={formErrors.precio_venta_lote}
                    disabled={loadingAction}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0.01, step: 0.01 }
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Fecha de Vencimiento"
                name="fecha_vencimiento_lote"
                type="date"
                value={formData.fecha_vencimiento_lote}
                onChange={handleInputChange}
                fullWidth
                disabled={loadingAction}
                size="small"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Observaciones"
                name="observaciones_lote"
                value={formData.observaciones_lote}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={loadingAction}
                size="small"
                placeholder="Observaciones adicionales del lote"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo_lote}
                    onChange={handleSwitchChange}
                    color="primary"
                    disabled={loadingAction}
                  />
                }
                label="Lote activo"
              />

              {!selectedLote && (
                <FormHelperText>
                  La fecha de ingreso se asignará automáticamente en el servidor
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
              disabled={loadingAction || !formData.numero_lote?.trim() || !formData.id_producto || !formData.cantidad_recibida_lote || !formData.precio_compra_lote || !formData.precio_venta_lote}
              startIcon={loadingAction ? <CircularProgress size={20} /> : null}
            >
              {loadingAction ? 'Guardando...' : (selectedLote ? 'Actualizar' : 'Crear')}
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
              ¿Estás seguro de que deseas eliminar el lote?
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {selectedLote?.numero_lote}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Producto: {getProductoNombre(selectedLote?.id_producto)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Cantidad disponible: {selectedLote?.cantidad_disponible_lote}
              </Typography>
              {selectedLote?.proveedor_nombre && (
                <Typography variant="body2" color="textSecondary">
                  Proveedor: {getProveedorNombre(selectedLote?.id_proveedor)}
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
              onClick={deleteLote} 
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

export default LotesCRUD;