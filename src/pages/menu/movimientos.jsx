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
  Paper as MuiPaper,
  AlertTitle
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
  DateRange as DateRangeIcon,
  SwapHoriz as SwapHorizIcon,
  ShoppingCart as ShoppingCartIcon,
  PointOfSale as PointOfSaleIcon,
  CompareArrows as CompareArrowsIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Inventory2 as StockIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// Librerías para exportación
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_URL = 'http://127.0.0.1:8000/api/menu-movimientos/';
const PRODUCTOS_URL = 'http://127.0.0.1:8000/api/menu-productos/';
const LOTES_URL = 'http://127.0.0.1:8000/api/menu-lotes/';
const USUARIOS_URL = 'http://127.0.0.1:8000/api/usuarios/';

// Mapeo de tipos de movimiento para mostrar nombres descriptivos
const TIPOS_MOVIMIENTO = {
  1: { nombre: 'COMPRA', color: 'success', icon: ShoppingCartIcon, tipo: 'entrada' },
  2: { nombre: 'VENTA', color: 'error', icon: PointOfSaleIcon, tipo: 'salida' },
  3: { nombre: 'AJUSTE+', color: 'info', icon: SwapHorizIcon, tipo: 'entrada' },
  4: { nombre: 'AJUSTE-', color: 'warning', icon: SwapHorizIcon, tipo: 'salida' },
  5: { nombre: 'DEVOLUCIÓN', color: 'secondary', icon: CompareArrowsIcon, tipo: 'entrada' },
  6: { nombre: 'TRANSFERENCIA', color: 'primary', icon: CompareArrowsIcon, tipo: 'salida' },
  7: { nombre: 'INVENTARIO_INI', color: 'success', icon: WarehouseIcon, tipo: 'entrada' },
  8: { nombre: 'INVENTARIO_FIN', color: 'error', icon: WarehouseIcon, tipo: 'salida' }
};

// Tipos de movimiento que requieren validación de stock (salidas)
const TIPOS_SALIDA = [2, 4, 6, 8]; // VENTA, AJUSTE-, TRANSFERENCIA, INVENTARIO_FIN

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

// Componente para mostrar alerta de stock
const StockAlert = ({ stockDisponible, cantidadSolicitada, tipoMovimiento }) => {
  if (!cantidadSolicitada || !stockDisponible) return null;
  
  const esSalida = TIPOS_SALIDA.includes(parseInt(tipoMovimiento));
  if (!esSalida) return null;
  
  const cantidad = parseFloat(cantidadSolicitada) || 0;
  const stock = parseFloat(stockDisponible) || 0;
  
  if (cantidad > stock) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <AlertTitle>Stock insuficiente</AlertTitle>
        La cantidad solicitada ({cantidad}) excede el stock disponible ({stock}) para este lote.
      </Alert>
    );
  } else if (cantidad > stock * 0.8) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        <AlertTitle>Stock bajo</AlertTitle>
        Estás utilizando el {((cantidad / stock) * 100).toFixed(0)}% del stock disponible ({stock}).
      </Alert>
    );
  }
  return null;
};

const MovimientosCRUD = () => {
  // Estados para datos
  const [movimientos, setMovimientos] = useState([]);
  const [filteredMovimientos, setFilteredMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [filteredLotes, setFilteredLotes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
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
    tipoMovimiento: 'todos',
    fechaInicio: null,
    fechaFin: null,
    lote: 'todos'
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
  const [selectedMovimiento, setSelectedMovimiento] = useState(null);
  
  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    tipo_movimiento: '',
    cantidad_movimiento: '',
    precio_unitario_movimiento: '',
    fecha_movimiento: '',
    motivo_movimiento: '',
    documento_referencia_movimiento: '',
    observaciones_movimiento: '',
    id_producto: '',
    id_lote: '',
    id_tipo_movimiento: ''
  });

  // Estado para validación
  const [formErrors, setFormErrors] = useState({});
  
  // Estado para stock disponible del lote seleccionado
  const [stockDisponible, setStockDisponible] = useState(null);

  // Función simplificada para obtener headers con token
  const getHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Token encontrado, enviando autorización');
    } else {
      console.warn('No se encontró token de autenticación');
    }
    
    return headers;
  };

  // Función para obtener stock disponible de un lote (usando cantidad_recibida_lote)
  const getStockLote = useCallback((loteId) => {
    if (!loteId) return null;
    const lote = lotes.find(l => l.id_lote === parseInt(loteId));
    // Usar cantidad_recibida_lote como stock disponible
    return lote ? lote.cantidad_recibida_lote || 0 : null;
  }, [lotes]);

  // Función para calcular el stock disponible considerando los movimientos
  const calcularStockDisponible = useCallback((loteId) => {
    if (!loteId) return 0;
    
    const lote = lotes.find(l => l.id_lote === parseInt(loteId));
    if (!lote) return 0;
    
    // Stock base es la cantidad recibida
    const stockBase = lote.cantidad_recibida_lote || 0;
    
    // Calcular todas las salidas de este lote
    const salidas = movimientos
      .filter(m => 
        m.id_lote === parseInt(loteId) && 
        TIPOS_SALIDA.includes(m.id_tipo_movimiento)
      )
      .reduce((total, m) => total + (m.cantidad_movimiento || 0), 0);
    
    // Si estamos editando un movimiento, no considerar ese movimiento en el cálculo
    if (selectedMovimiento && selectedMovimiento.id_lote === parseInt(loteId)) {
      const movimientoActual = movimientos.find(m => m.id_movimiento === selectedMovimiento.id_movimiento);
      if (movimientoActual && TIPOS_SALIDA.includes(movimientoActual.id_tipo_movimiento)) {
        salidas -= movimientoActual.cantidad_movimiento;
      }
    }
    
    return stockBase - salidas;
  }, [lotes, movimientos, selectedMovimiento]);

  // Función para filtrar lotes por producto
  const filterLotesByProducto = useCallback((productoId) => {
    if (!productoId) {
      setFilteredLotes([]);
      return;
    }
    
    const lotesFiltrados = lotes
      .filter(lote => lote.id_producto === parseInt(productoId))
      .sort((a, b) => {
        // Ordenar por fecha de vencimiento (los más próximos primero)
        if (a.fecha_vencimiento && b.fecha_vencimiento) {
          return new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento);
        }
        return 0;
      });
    
    setFilteredLotes(lotesFiltrados);
    
    // Si el lote actualmente seleccionado no pertenece al nuevo producto, limpiarlo
    if (formData.id_lote) {
      const loteSeleccionado = lotesFiltrados.find(
        l => l.id_lote === parseInt(formData.id_lote)
      );
      if (!loteSeleccionado) {
        setFormData(prev => ({
          ...prev,
          id_lote: ''
        }));
        setStockDisponible(null);
      }
    }
  }, [lotes, formData.id_lote]);

  // Función para obtener TODOS los movimientos (manejando paginación)
  const fetchAllMovimientos = async () => {
    setLoading(true);
    try {
      let allMovimientos = [];
      let nextUrl = API_URL;
      let total = 0;
      let pageCount = 0;

      showSnackbar('Cargando todos los movimientos...', 'info');

      while (nextUrl) {
        pageCount++;
        console.log(`Cargando página ${pageCount} de movimientos...`);
        
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar los movimientos');

        const data = await response.json();
        allMovimientos = [...allMovimientos, ...(data.results || [])];
        total = data.count || allMovimientos.length;
        nextUrl = data.next;
      }

      console.log(`Total de movimientos cargados: ${allMovimientos.length} de ${total} (${pageCount} páginas)`);

      // Enriquecer datos con nombres relacionados
      const enrichedData = allMovimientos.map(mov => ({
        ...mov,
        producto_nombre: getProductoNombre(mov.id_producto),
        lote_numero: getLoteNumero(mov.id_lote),
        usuario_nombre: getUsuarioNombre(mov.usuario_id),
        tipo_info: TIPOS_MOVIMIENTO[mov.id_tipo_movimiento] || { nombre: mov.tipo_movimiento, color: 'default', icon: AssignmentIcon }
      }));

      setMovimientos(enrichedData);
      setFilteredMovimientos(enrichedData);
      setTotalCount(enrichedData.length);

      showSnackbar(`${enrichedData.length} movimientos cargados exitosamente`, 'success');

    } catch (error) {
      console.error('Error en fetchAllMovimientos:', error);
      showSnackbar('Error al cargar los movimientos', 'error');
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

  // Función para obtener lotes
  const fetchLotes = async () => {
    try {
      let allLotes = [];
      let nextUrl = LOTES_URL;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar los lotes');

        const data = await response.json();
        allLotes = [...allLotes, ...(data.results || [])];
        nextUrl = data.next;
      }

      setLotes(allLotes);
      console.log('Lotes cargados:', allLotes.map(l => ({
        id: l.id_lote,
        numero: l.numero_lote,
        cantidad_recibida: l.cantidad_recibida_lote,
        producto: l.id_producto
      })));
    } catch (error) {
      console.error('Error en fetchLotes:', error);
    }
  };

  // Función para obtener usuarios (solo para mostrar nombres, no para determinar el usuario actual)
  const fetchUsuarios = async () => {
    try {
      let allUsuarios = [];
      let nextUrl = USUARIOS_URL;

      while (nextUrl) {
        const response = await fetch(nextUrl, {
          method: 'GET',
          headers: getHeaders()
        });

        if (!response.ok) throw new Error('Error al cargar los usuarios');

        const data = await response.json();
        allUsuarios = [...allUsuarios, ...(data.results || [])];
        nextUrl = data.next;
      }

      setUsuarios(allUsuarios);
      console.log('Usuarios cargados para mostrar nombres:', allUsuarios.length);
      
    } catch (error) {
      console.error('Error en fetchUsuarios:', error);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('Cargando datos iniciales...');
      
      await Promise.all([
        fetchProductos(),
        fetchLotes(),
        fetchUsuarios(),
        fetchAllMovimientos()
      ]);
      
      // Inicializar filteredLotes vacío
      setFilteredLotes([]);
      
      console.log('=== FIN DE CARGA INICIAL ===');
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
  }, [debouncedFilters, movimientos]);

  const getProductoNombre = useCallback((id) => {
    const producto = productos.find(p => p.id_producto === id);
    return producto ? producto.nombre_producto : id;
  }, [productos]);

  const getLoteNumero = useCallback((id) => {
    const lote = lotes.find(l => l.id_lote === id);
    return lote ? lote.numero_lote : 'Sin lote';
  }, [lotes]);

  const getUsuarioNombre = useCallback((id) => {
    const usuario = usuarios.find(u => u.id === id);
    return usuario ? usuario.nombre || usuario.username || usuario.email : id;
  }, [usuarios]);

  const getTipoMovimientoInfo = useCallback((id) => {
    return TIPOS_MOVIMIENTO[id] || { nombre: 'Desconocido', color: 'default', icon: AssignmentIcon };
  }, []);

  // Función de filtrado optimizada
  const applyFilters = useCallback(() => {
    const filtered = movimientos.filter(mov => {
      // Filtro de búsqueda
      if (debouncedFilters.search) {
        const searchLower = debouncedFilters.search.toLowerCase();
        const matchesSearch = 
          mov.tipo_movimiento?.toLowerCase().includes(searchLower) ||
          getProductoNombre(mov.id_producto)?.toLowerCase().includes(searchLower) ||
          getLoteNumero(mov.id_lote)?.toLowerCase().includes(searchLower) ||
          (mov.motivo_movimiento && mov.motivo_movimiento.toLowerCase().includes(searchLower)) ||
          (mov.documento_referencia_movimiento && mov.documento_referencia_movimiento.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Filtro de producto
      if (debouncedFilters.producto !== 'todos' && 
          mov.id_producto !== parseInt(debouncedFilters.producto)) {
        return false;
      }

      // Filtro de tipo de movimiento
      if (debouncedFilters.tipoMovimiento !== 'todos' && 
          mov.id_tipo_movimiento !== parseInt(debouncedFilters.tipoMovimiento)) {
        return false;
      }

      // Filtro de lote
      if (debouncedFilters.lote !== 'todos' && 
          mov.id_lote !== parseInt(debouncedFilters.lote)) {
        return false;
      }

      // Filtro de fechas
      if (debouncedFilters.fechaInicio && mov.fecha_movimiento) {
        const movDate = new Date(mov.fecha_movimiento);
        if (movDate < debouncedFilters.fechaInicio) return false;
      }

      if (debouncedFilters.fechaFin && mov.fecha_movimiento) {
        const movDate = new Date(mov.fecha_movimiento);
        const endDate = new Date(debouncedFilters.fechaFin);
        endDate.setHours(23, 59, 59, 999);
        if (movDate > endDate) return false;
      }

      return true;
    });

    setFilteredMovimientos(filtered);
    setPage(0);
  }, [debouncedFilters, movimientos, getProductoNombre, getLoteNumero]);

  const clearFilters = () => {
    setFilters({
      search: '',
      producto: 'todos',
      tipoMovimiento: 'todos',
      fechaInicio: null,
      fechaFin: null,
      lote: 'todos'
    });
  };

  // Validar stock antes de crear/actualizar
  const validateStock = useCallback(() => {
    const esSalida = TIPOS_SALIDA.includes(parseInt(formData.id_tipo_movimiento));
    
    if (!esSalida) return true; // No validar stock para entradas
    
    if (!formData.id_lote) {
      setFormErrors(prev => ({
        ...prev,
        id_lote: 'Debe seleccionar un lote para movimientos de salida'
      }));
      return false;
    }
    
    const stock = calcularStockDisponible(formData.id_lote);
    const cantidad = parseFloat(formData.cantidad_movimiento) || 0;
    
    if (cantidad > stock) {
      setFormErrors(prev => ({
        ...prev,
        cantidad_movimiento: `Stock insuficiente. Disponible: ${stock}`
      }));
      return false;
    }
    
    return true;
  }, [formData.id_tipo_movimiento, formData.id_lote, formData.cantidad_movimiento, calcularStockDisponible]);

  // Crear nuevo movimiento - SIN ENVIAR usuario_id
  const createMovimiento = async () => {
    if (!validateForm()) return;
    if (!validateStock()) return;
    
    setLoadingAction(true);
    try {
      console.log('=== INICIO CREAR MOVIMIENTO ===');
      
      // El backend obtendrá el usuario del token automáticamente
      const movimientoData = {
        tipo_movimiento: formData.tipo_movimiento,
        cantidad_movimiento: parseInt(formData.cantidad_movimiento) || 0,
        precio_unitario_movimiento: parseFloat(formData.precio_unitario_movimiento) || 0,
        fecha_movimiento: formData.fecha_movimiento || new Date().toISOString(),
        motivo_movimiento: formData.motivo_movimiento?.trim() || null,
        documento_referencia_movimiento: formData.documento_referencia_movimiento?.trim() || null,
        observaciones_movimiento: formData.observaciones_movimiento?.trim() || null,
        id_producto: parseInt(formData.id_producto),
        id_lote: formData.id_lote ? parseInt(formData.id_lote) : null,
        id_tipo_movimiento: parseInt(formData.id_tipo_movimiento)
        // NO enviamos usuario_id - el backend lo obtendrá del token
      };

      console.log('Enviando datos al backend:', movimientoData);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(movimientoData)
      });
      
      const responseText = await response.text();
      console.log('Respuesta del backend:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Error al crear el movimiento';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      showSnackbar('Movimiento creado exitosamente', 'success');
      handleCloseDialog();
      await fetchAllMovimientos();
      await fetchLotes(); // Recargar lotes para actualizar stock
      
    } catch (error) {
      console.error('Error en createMovimiento:', error);
      showSnackbar(error.message || 'Error al crear el movimiento', 'error');
    } finally {
      setLoadingAction(false);
      console.log('=== FIN CREAR MOVIMIENTO ===');
    }
  };

  // Actualizar movimiento - SIN ENVIAR usuario_id
  const updateMovimiento = async () => {
    if (!validateForm()) return;
    if (!validateStock()) return;
    
    setLoadingAction(true);
    try {
      console.log('=== INICIO ACTUALIZAR MOVIMIENTO ===');
      
      // El backend obtendrá el usuario del token automáticamente
      const movimientoData = {
        tipo_movimiento: formData.tipo_movimiento,
        cantidad_movimiento: parseInt(formData.cantidad_movimiento) || 0,
        precio_unitario_movimiento: parseFloat(formData.precio_unitario_movimiento) || 0,
        fecha_movimiento: formData.fecha_movimiento,
        motivo_movimiento: formData.motivo_movimiento?.trim() || null,
        documento_referencia_movimiento: formData.documento_referencia_movimiento?.trim() || null,
        observaciones_movimiento: formData.observaciones_movimiento?.trim() || null,
        id_producto: parseInt(formData.id_producto),
        id_lote: formData.id_lote ? parseInt(formData.id_lote) : null,
        id_tipo_movimiento: parseInt(formData.id_tipo_movimiento)
        // NO enviamos usuario_id - el backend lo obtendrá del token
      };

      console.log('Actualizando movimiento:', movimientoData);

      const response = await fetch(`${API_URL}${selectedMovimiento.id_movimiento}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(movimientoData)
      });
      
      const responseText = await response.text();
      console.log('Respuesta del backend:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Error al actualizar el movimiento';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || JSON.stringify(errorData);
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      showSnackbar('Movimiento actualizado exitosamente', 'success');
      handleCloseDialog();
      await fetchAllMovimientos();
      await fetchLotes(); // Recargar lotes para actualizar stock
      
    } catch (error) {
      console.error('Error en updateMovimiento:', error);
      showSnackbar(error.message || 'Error al actualizar el movimiento', 'error');
    } finally {
      setLoadingAction(false);
      console.log('=== FIN ACTUALIZAR MOVIMIENTO ===');
    }
  };

  // Eliminar movimiento
  const deleteMovimiento = async () => {
    setLoadingAction(true);
    try {
      const response = await fetch(`${API_URL}${selectedMovimiento.id_movimiento}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al eliminar el movimiento');
      }
      
      showSnackbar('Movimiento eliminado exitosamente', 'success');
      setOpenDeleteDialog(false);
      await fetchAllMovimientos();
      await fetchLotes(); // Recargar lotes para actualizar stock
      
    } catch (error) {
      console.error('Error en deleteMovimiento:', error);
      showSnackbar('Error al eliminar el movimiento', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Funciones de exportación
  const exportToExcel = () => {
    try {
      const dataToExport = filteredMovimientos.map(mov => ({
        ID: mov.id_movimiento,
        'Tipo Movimiento': mov.tipo_movimiento,
        Producto: getProductoNombre(mov.id_producto),
        'N° Lote': getLoteNumero(mov.id_lote),
        Cantidad: mov.cantidad_movimiento,
        'Precio Unitario': parseFloat(mov.precio_unitario_movimiento).toFixed(2),
        'Total': (mov.cantidad_movimiento * parseFloat(mov.precio_unitario_movimiento)).toFixed(2),
        'Fecha': formatDate(mov.fecha_movimiento),
        Motivo: mov.motivo_movimiento || '',
        'Documento Ref.': mov.documento_referencia_movimiento || '',
        Usuario: mov.usuario_nombre || mov.usuario_id,
        Observaciones: mov.observaciones_movimiento || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
      XLSX.writeFile(wb, `movimientos_${new Date().toISOString().split('T')[0]}.xlsx`);
      
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
      doc.text('Listado de Movimientos', 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, 14, 32);
      
      let filtrosAplicados = [];
      if (filters.search) filtrosAplicados.push(`Búsqueda: "${filters.search}"`);
      if (filters.producto !== 'todos') filtrosAplicados.push(`Producto: ${getProductoNombre(parseInt(filters.producto))}`);
      if (filters.tipoMovimiento !== 'todos') filtrosAplicados.push(`Tipo: ${getTipoMovimientoInfo(parseInt(filters.tipoMovimiento)).nombre}`);
      
      if (filtrosAplicados.length > 0) {
        doc.setFontSize(10);
        doc.text('Filtros aplicados:', 14, 40);
        doc.text(filtrosAplicados.join(' • '), 14, 46);
      }
      
      const tableColumn = ['ID', 'Tipo', 'Producto', 'Lote', 'Cantidad', 'P. Unitario', 'Total', 'Fecha', 'Motivo', 'Documento'];
      const tableRows = filteredMovimientos.map(mov => [
        mov.id_movimiento,
        mov.tipo_movimiento,
        getProductoNombre(mov.id_producto),
        getLoteNumero(mov.id_lote),
        mov.cantidad_movimiento,
        `$${parseFloat(mov.precio_unitario_movimiento).toFixed(2)}`,
        `$${(mov.cantidad_movimiento * parseFloat(mov.precio_unitario_movimiento)).toFixed(2)}`,
        formatDateShort(mov.fecha_movimiento),
        mov.motivo_movimiento || '-',
        mov.documento_referencia_movimiento || '-'
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
      doc.text(`Total de registros: ${filteredMovimientos.length}`, 14, doc.lastAutoTable.finalY + 10);
      
      doc.save(`movimientos_${new Date().toISOString().split('T')[0]}.pdf`);
      
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
    if (!formData.id_tipo_movimiento) {
      errors.id_tipo_movimiento = 'El tipo de movimiento es requerido';
    }
    if (!formData.id_producto) {
      errors.id_producto = 'El producto es requerido';
    }
    if (!formData.cantidad_movimiento || parseInt(formData.cantidad_movimiento) <= 0) {
      errors.cantidad_movimiento = 'La cantidad debe ser mayor a 0';
    }
    if (!formData.precio_unitario_movimiento || parseFloat(formData.precio_unitario_movimiento) <= 0) {
      errors.precio_unitario_movimiento = 'El precio unitario debe ser mayor a 0';
    }
    
    // Validar lote para movimientos de salida
    const esSalida = TIPOS_SALIDA.includes(parseInt(formData.id_tipo_movimiento));
    if (esSalida && !formData.id_lote) {
      errors.id_lote = 'Debe seleccionar un lote para movimientos de salida';
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
    setSelectedMovimiento(null);
    // Obtener fecha actual en formato ISO para datetime-local (YYYY-MM-DDTHH:mm)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const fechaActual = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setFormData({
      tipo_movimiento: '',
      cantidad_movimiento: '',
      precio_unitario_movimiento: '',
      fecha_movimiento: fechaActual, // Fecha actual automática
      motivo_movimiento: '',
      documento_referencia_movimiento: '',
      observaciones_movimiento: '',
      id_producto: '',
      id_lote: '',
      id_tipo_movimiento: ''
    });
    setFilteredLotes([]);
    setStockDisponible(null);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (movimiento) => {
    setSelectedMovimiento(movimiento);
    // Para edición, usar la fecha del movimiento (formato datetime-local)
    let fechaFormato = movimiento.fecha_movimiento;
    if (fechaFormato && fechaFormato.includes('T')) {
      // Ya está en formato ISO
    } else if (fechaFormato) {
      // Convertir fecha simple a formato datetime-local
      const date = new Date(fechaFormato);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      fechaFormato = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    setFormData({
      tipo_movimiento: movimiento.tipo_movimiento,
      cantidad_movimiento: movimiento.cantidad_movimiento,
      precio_unitario_movimiento: movimiento.precio_unitario_movimiento,
      fecha_movimiento: fechaFormato,
      motivo_movimiento: movimiento.motivo_movimiento || '',
      documento_referencia_movimiento: movimiento.documento_referencia_movimiento || '',
      observaciones_movimiento: movimiento.observaciones_movimiento || '',
      id_producto: movimiento.id_producto,
      id_lote: movimiento.id_lote || '',
      id_tipo_movimiento: movimiento.id_tipo_movimiento
    });
    
    // Filtrar lotes para el producto del movimiento que se está editando
    if (movimiento.id_producto) {
      filterLotesByProducto(movimiento.id_producto);
    }
    
    // Obtener stock disponible del lote seleccionado (considerando movimientos)
    if (movimiento.id_lote) {
      const stock = calcularStockDisponible(movimiento.id_lote);
      setStockDisponible(stock);
    }
    
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenViewDialog = (movimiento) => {
    setSelectedMovimiento(movimiento);
    setOpenViewDialog(true);
  };

  const handleOpenDeleteDialog = (movimiento) => {
    setSelectedMovimiento(movimiento);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMovimiento(null);
    setFilteredLotes([]);
    setStockDisponible(null);
    setFormData({
      tipo_movimiento: '',
      cantidad_movimiento: '',
      precio_unitario_movimiento: '',
      fecha_movimiento: '',
      motivo_movimiento: '',
      documento_referencia_movimiento: '',
      observaciones_movimiento: '',
      id_producto: '',
      id_lote: '',
      id_tipo_movimiento: ''
    });
    setFormErrors({});
  };

  const handleSubmit = () => {
    if (selectedMovimiento) {
      updateMovimiento();
    } else {
      createMovimiento();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Actualizar el formData
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };
      
      // Si cambió el producto, filtrar los lotes
      if (name === 'id_producto' && value) {
        filterLotesByProducto(value);
      }
      
      // Si cambió el lote, actualizar stock disponible (considerando movimientos)
      if (name === 'id_lote' && value) {
        const stock = calcularStockDisponible(value);
        setStockDisponible(stock);
      }
      
      return newFormData;
    });
    
    // Limpiar errores si existen
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
    fetchAllMovimientos();
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

  // Formatear fecha para mostrar en modo solo lectura
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  // Obtener datos de la página actual (optimizado con useMemo)
  const currentPageData = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredMovimientos.slice(start, end);
  }, [filteredMovimientos, page, rowsPerPage]);

  const hasActiveFilters = useMemo(() => {
    return filters.search || 
           filters.producto !== 'todos' || 
           filters.tipoMovimiento !== 'todos' ||
           filters.lote !== 'todos' ||
           filters.fechaInicio || 
           filters.fechaFin;
  }, [filters]);

  // Calcular estadísticas (optimizado con useMemo)
  const stats = useMemo(() => ({
    total: filteredMovimientos.length,
    compras: filteredMovimientos.filter(m => m.id_tipo_movimiento === 1).length,
    ventas: filteredMovimientos.filter(m => m.id_tipo_movimiento === 2).length,
    ajustes: filteredMovimientos.filter(m => m.id_tipo_movimiento === 3 || m.id_tipo_movimiento === 4).length,
    totalValor: filteredMovimientos.reduce((sum, m) => sum + (m.cantidad_movimiento * parseFloat(m.precio_unitario_movimiento)), 0)
  }), [filteredMovimientos]);

  // Determinar si es un movimiento de salida
  const esMovimientoSalida = useMemo(() => {
    return TIPOS_SALIDA.includes(parseInt(formData.id_tipo_movimiento));
  }, [formData.id_tipo_movimiento]);

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
                <CompareArrowsIcon />
              </Avatar>
              <Typography variant="h5" component="h1">
                Gestión de Movimientos
              </Typography>
              <Badge
                badgeContent={filteredMovimientos.length}
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title="Exportar datos">
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportClick}
                  disabled={filteredMovimientos.length === 0}
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
                Nuevo Movimiento
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
                      <CompareArrowsIcon />
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
                      <Typography color="success.dark" variant="body2">Compras</Typography>
                      <Typography variant="h4" color="success.dark">{stats.compras}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <ShoppingCartIcon />
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
                      <Typography color="error.dark" variant="body2">Ventas</Typography>
                      <Typography variant="h4" color="error.dark">{stats.ventas}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'error.main' }}>
                      <PointOfSaleIcon />
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
                      <Typography color="info.dark" variant="body2">Valor Total</Typography>
                      <Typography variant="h4" color="info.dark">
                        ${stats.totalValor.toFixed(2)}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <MoneyIcon />
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
                  placeholder="Buscar por tipo, producto, lote..."
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
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filters.tipoMovimiento}
                    label="Tipo"
                    onChange={(e) => handleFilterChange('tipoMovimiento', e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    {Object.entries(TIPOS_MOVIMIENTO).map(([id, tipo]) => (
                      <MenuItem key={id} value={id}>
                        {tipo.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lote</InputLabel>
                  <Select
                    value={filters.lote}
                    label="Lote"
                    onChange={(e) => handleFilterChange('lote', e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    {lotes.map(lote => (
                      <MenuItem key={lote.id_lote} value={lote.id_lote}>
                        {lote.numero_lote}
                      </MenuItem>
                    ))}
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Producto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Lote</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Cantidad</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">P. Unitario</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Total</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Motivo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Documento</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                        Cargando todos los movimientos...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : currentPageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                      <CompareArrowsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        No hay movimientos disponibles
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
                        Crear movimiento
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  currentPageData.map((mov) => {
                    const TipoIcon = mov.tipo_info.icon;
                    const total = mov.cantidad_movimiento * parseFloat(mov.precio_unitario_movimiento);
                    
                    return (
                      <TableRow 
                        key={mov.id_movimiento}
                        hover
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        <TableCell>
                          <Chip 
                            label={mov.id_movimiento} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<TipoIcon />}
                            label={mov.tipo_movimiento}
                            size="small"
                            color={mov.tipo_info.color}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ProductIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {getProductoNombre(mov.id_producto)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getLoteNumero(mov.id_lote)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {mov.cantidad_movimiento}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${parseFloat(mov.precio_unitario_movimiento).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="primary">
                            ${total.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={formatDate(mov.fecha_movimiento)}>
                            <Chip
                              label={formatDateShort(mov.fecha_movimiento)}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {mov.motivo_movimiento || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {mov.documento_referencia_movimiento || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Ver detalles">
                              <IconButton
                                color="info"
                                onClick={() => handleOpenViewDialog(mov)}
                                size="small"
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                color="primary"
                                onClick={() => handleOpenEditDialog(mov)}
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                color="error"
                                onClick={() => handleOpenDeleteDialog(mov)}
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
          
          {!loading && filteredMovimientos.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={filteredMovimientos.length}
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
                <CompareArrowsIcon />
              </Avatar>
              <Typography variant="h6">
                Detalles del Movimiento #{selectedMovimiento?.id_movimiento}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {selectedMovimiento && (
              <Box>
                {/* Información General */}
                <DetailSection title="Información General">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={NumbersIcon}
                        label="ID del Movimiento"
                        value={selectedMovimiento.id_movimiento}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CategoryIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="textSecondary">
                            Tipo de Movimiento
                          </Typography>
                        </Box>
                        <Box sx={{ pl: 3.5 }}>
                          <Chip
                            icon={selectedMovimiento.tipo_info.icon ? <selectedMovimiento.tipo_info.icon /> : null}
                            label={selectedMovimiento.tipo_movimiento}
                            color={selectedMovimiento.tipo_info.color}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={ProductIcon}
                        label="Producto"
                        value={getProductoNombre(selectedMovimiento.id_producto)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={WarehouseIcon}
                        label="Lote"
                        value={getLoteNumero(selectedMovimiento.id_lote)}
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Cantidades y Precios */}
                <DetailSection title="Cantidades y Precios">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <DetailItem 
                        icon={NumbersIcon}
                        label="Cantidad"
                        value={selectedMovimiento.cantidad_movimiento}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <DetailItem 
                        icon={MoneyIcon}
                        label="Precio Unitario"
                        value={`$${parseFloat(selectedMovimiento.precio_unitario_movimiento).toFixed(2)}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <DetailItem 
                        icon={MoneyIcon}
                        label="Total"
                        value={`$${(selectedMovimiento.cantidad_movimiento * parseFloat(selectedMovimiento.precio_unitario_movimiento)).toFixed(2)}`}
                        color="primary.main"
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Fechas */}
                <DetailSection title="Fechas">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <DetailItem 
                        icon={DateRangeIcon}
                        label="Fecha del Movimiento"
                        value={formatDate(selectedMovimiento.fecha_movimiento)}
                      />
                    </Grid>
                  </Grid>
                </DetailSection>

                {/* Detalles Adicionales */}
                <DetailSection title="Detalles Adicionales">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={AssignmentIcon}
                        label="Motivo"
                        value={selectedMovimiento.motivo_movimiento || 'Sin motivo'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DetailItem 
                        icon={ReceiptIcon}
                        label="Documento Referencia"
                        value={selectedMovimiento.documento_referencia_movimiento || 'Sin documento'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <DetailItem 
                        icon={PersonIcon}
                        label="Usuario"
                        value={getUsuarioNombre(selectedMovimiento.usuario_id)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <DetailItem 
                        icon={AssignmentIcon}
                        label="Observaciones"
                        value={selectedMovimiento.observaciones_movimiento || 'Sin observaciones'}
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

        {/* Diálogo para Crear/Editar - CON VALIDACIÓN DE STOCK */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          disableEscapeKeyDown={loadingAction}
        >
          <DialogTitle>
            <Typography variant="h6">
              {selectedMovimiento ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" error={!!formErrors.id_tipo_movimiento}>
                    <InputLabel>Tipo de Movimiento *</InputLabel>
                    <Select
                      name="id_tipo_movimiento"
                      value={formData.id_tipo_movimiento}
                      label="Tipo de Movimiento *"
                      onChange={handleInputChange}
                      disabled={loadingAction}
                    >
                      {Object.entries(TIPOS_MOVIMIENTO).map(([id, tipo]) => (
                        <MenuItem key={id} value={id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {tipo.icon && <tipo.icon fontSize="small" />}
                            <Typography>{tipo.nombre}</Typography>
                            <Chip 
                              label={tipo.tipo === 'entrada' ? 'Entrada' : 'Salida'} 
                              size="small"
                              color={tipo.tipo === 'entrada' ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.id_tipo_movimiento && (
                      <FormHelperText>{formErrors.id_tipo_movimiento}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
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
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" error={!!formErrors.id_lote}>
                    <InputLabel>
                      Lote {esMovimientoSalida ? '*' : ''}
                    </InputLabel>
                    <Select
                      name="id_lote"
                      value={formData.id_lote}
                      label={`Lote ${esMovimientoSalida ? '*' : ''}`}
                      onChange={handleInputChange}
                      disabled={loadingAction || !formData.id_producto}
                      renderValue={(selected) => {
                        const lote = filteredLotes.find(l => l.id_lote === selected);
                        if (!lote) return <em>Seleccionar lote</em>;
                        const stock = calcularStockDisponible(selected);
                        return (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span>{lote.numero_lote}</span>
                            <Chip
                              icon={<StockIcon fontSize="small" />}
                              label={`Stock: ${stock}`}
                              size="small"
                              color={stock > 0 ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        );
                      }}
                    >
                      <MenuItem value="">Sin lote</MenuItem>
                      {filteredLotes.map(lote => {
                        const stock = calcularStockDisponible(lote.id_lote);
                        return (
                          <MenuItem key={lote.id_lote} value={lote.id_lote}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">{lote.numero_lote}</Typography>
                                <Chip
                                  icon={<StockIcon fontSize="small" />}
                                  label={`Stock: ${stock}`}
                                  size="small"
                                  color={stock > 0 ? 'success' : 'error'}
                                  variant="outlined"
                                />
                              </Box>
                              {lote.fecha_vencimiento && (
                                <Typography variant="caption" color="textSecondary">
                                  Vence: {new Date(lote.fecha_vencimiento).toLocaleDateString('es-ES')}
                                </Typography>
                              )}
                              <Typography variant="caption" color="textSecondary">
                                Recibido: {lote.cantidad_recibida_lote || 0}
                              </Typography>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {formErrors.id_lote && (
                      <FormHelperText error>{formErrors.id_lote}</FormHelperText>
                    )}
                    {formData.id_producto && filteredLotes.length === 0 && (
                      <FormHelperText>
                        No hay lotes disponibles para este producto
                      </FormHelperText>
                    )}
                  </FormControl>
                  {formData.id_producto && filteredLotes.length > 0 && (
                    <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                      {filteredLotes.length} lote(s) disponible(s) para este producto
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  {selectedMovimiento ? (
                    // En modo edición: campo editable
                    <TextField
                      label="Fecha del Movimiento"
                      name="fecha_movimiento"
                      type="datetime-local"
                      value={formData.fecha_movimiento}
                      onChange={handleInputChange}
                      fullWidth
                      disabled={loadingAction}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    // En modo creación: solo lectura informativa
                    <Box sx={{ 
                      p: 1.5, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'action.hover'
                    }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <CalendarIcon fontSize="inherit" />
                        Fecha de registro (automática)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {formatDateForDisplay(formData.fecha_movimiento)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                        La fecha se registrará automáticamente al crear el movimiento
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cantidad *"
                    name="cantidad_movimiento"
                    value={formData.cantidad_movimiento}
                    onChange={handleNumberChange}
                    fullWidth
                    required
                    type="number"
                    error={!!formErrors.cantidad_movimiento}
                    helperText={formErrors.cantidad_movimiento}
                    disabled={loadingAction}
                    size="small"
                    InputProps={{ 
                      inputProps: { min: 1 },
                      endAdornment: stockDisponible !== null && esMovimientoSalida && (
                        <InputAdornment position="end">
                          <Tooltip title={`Stock disponible: ${stockDisponible}`}>
                            <Chip
                              icon={<StockIcon />}
                              label={`disp: ${stockDisponible}`}
                              size="small"
                              color={parseFloat(formData.cantidad_movimiento) > stockDisponible ? 'error' : 'success'}
                              variant="outlined"
                            />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Precio Unitario *"
                    name="precio_unitario_movimiento"
                    value={formData.precio_unitario_movimiento}
                    onChange={handleNumberChange}
                    fullWidth
                    required
                    type="number"
                    error={!!formErrors.precio_unitario_movimiento}
                    helperText={formErrors.precio_unitario_movimiento}
                    disabled={loadingAction}
                    size="small"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0.01, step: 0.01 }
                    }}
                  />
                </Grid>
              </Grid>

              {/* Alerta de stock */}
              {esMovimientoSalida && formData.id_lote && (
                <StockAlert 
                  stockDisponible={stockDisponible}
                  cantidadSolicitada={formData.cantidad_movimiento}
                  tipoMovimiento={formData.id_tipo_movimiento}
                />
              )}

              <TextField
                label="Motivo"
                name="motivo_movimiento"
                value={formData.motivo_movimiento}
                onChange={handleInputChange}
                fullWidth
                disabled={loadingAction}
                size="small"
                placeholder="Motivo del movimiento"
              />

              <TextField
                label="Documento de Referencia"
                name="documento_referencia_movimiento"
                value={formData.documento_referencia_movimiento}
                onChange={handleInputChange}
                fullWidth
                disabled={loadingAction}
                size="small"
                placeholder="Ej: FACT-001, TICKET-045"
              />

              <TextField
                label="Observaciones"
                name="observaciones_movimiento"
                value={formData.observaciones_movimiento}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={loadingAction}
                size="small"
                placeholder="Observaciones adicionales"
              />

              {!selectedMovimiento && (
                <FormHelperText>
                  Los campos marcados con * son obligatorios. La fecha se registrará automáticamente.
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
              disabled={loadingAction || !formData.id_tipo_movimiento || !formData.id_producto || !formData.cantidad_movimiento || !formData.precio_unitario_movimiento || (esMovimientoSalida && !formData.id_lote)}
              startIcon={loadingAction ? <CircularProgress size={20} /> : null}
            >
              {loadingAction ? 'Guardando...' : (selectedMovimiento ? 'Actualizar' : 'Crear')}
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
              ¿Estás seguro de que deseas eliminar el movimiento?
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Movimiento #{selectedMovimiento?.id_movimiento}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tipo: {selectedMovimiento?.tipo_movimiento}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Producto: {getProductoNombre(selectedMovimiento?.id_producto)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Cantidad: {selectedMovimiento?.cantidad_movimiento}
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
              onClick={deleteMovimiento} 
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

export default MovimientosCRUD;