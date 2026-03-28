import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  Stack,
  LinearProgress,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Skeleton,
  FormHelperText
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
  Inventory as ProductIcon,
  Category as CategoryIcon,
  Straighten as UnitIcon,
  LocationOn as LocationIcon,
  WarningAmber as StockWarningIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

// Constantes
const API_URL = 'http://127.0.0.1:8000/api/menu-productos/';
const CATEGORIAS_URL = 'http://127.0.0.1:8000/api/menu-categorias/';
const UNIDADES_URL = 'http://127.0.0.1:8000/api/menu-unidades-medida/';

// Utilidades de exportación
const ExportUtils = {
  toCSV: (data, filename) => {
    const headers = [
      'ID', 'SKU', 'Nombre', 'Descripción', 'Categoría', 'Unidad', 
      'Stock Actual', 'Stock Mínimo', 'Stock Máximo', 'Ubicación', 
      'Estado', 'Fecha Creación'
    ];
    
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = [
        row.id_producto,
        `"${row.sku_producto || ''}"`,
        `"${row.nombre_producto || ''}"`,
        `"${row.descripcion_producto || ''}"`,
        `"${row.categoria_nombre || row.id_categoria}"`,
        `"${row.unidad_nombre || row.id_unidad_medida}"`,
        row.stock_actual_producto ?? '',
        row.stock_minimo_producto ?? '',
        row.stock_maximo_producto ?? '',
        `"${row.ubicacion_producto || ''}"`,
        row.activo_producto ? 'Activo' : 'Inactivo',
        `"${formatDateUtil(row.fecha_creacion_producto)}"`
      ];
      csvRows.push(values.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${filename}.csv`);
  },

  toJSON: (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, `${filename}.json`);
  }
};

const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatDateUtil = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
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

// Componente de Fila de Producto memoizado
const ProductoRow = memo(({ producto, onView, onEdit, onDelete, categorias, unidades }) => {
  const stockStatus = useMemo(() => {
    if (producto.stock_actual_producto <= 0) return 'sin_stock';
    if (producto.stock_actual_producto <= producto.stock_minimo_producto) return 'bajo';
    return 'normal';
  }, [producto.stock_actual_producto, producto.stock_minimo_producto]);

  const stockColor = useMemo(() => {
    switch(stockStatus) {
      case 'sin_stock': return 'error';
      case 'bajo': return 'warning';
      default: return 'success';
    }
  }, [stockStatus]);

  const categoriaNombre = useMemo(() => {
    const cat = categorias.find(c => c.id_categoria === producto.id_categoria);
    return cat?.nombre_categoria || producto.id_categoria;
  }, [categorias, producto.id_categoria]);

  const unidadInfo = useMemo(() => {
    const uni = unidades.find(u => u.id_unidad_medida === producto.id_unidad_medida);
    return uni ? `${uni.nombre_unidad} (${uni.simbolo_unidad})` : producto.id_unidad_medida;
  }, [unidades, producto.id_unidad_medida]);

  return (
    <TableRow 
      hover
      sx={{ 
        '&:last-child td, &:last-child th': { border: 0 },
        backgroundColor: stockStatus === 'sin_stock' ? 'rgba(239, 83, 80, 0.05)' : 
                       stockStatus === 'bajo' ? 'rgba(255, 193, 7, 0.05)' : 'inherit'
      }}
    >
      <TableCell>
        <Chip 
          label={producto.id_producto} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Chip
          label={producto.sku_producto}
          size="small"
          color="info"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body1" fontWeight="medium">
          {producto.nombre_producto}
        </Typography>
        {producto.descripcion_producto && (
          <Typography variant="caption" color="textSecondary" display="block" noWrap sx={{ maxWidth: 200 }}>
            {producto.descripcion_producto}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip
          icon={<CategoryIcon />}
          label={categoriaNombre}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Chip
          icon={<UnitIcon />}
          label={unidadInfo}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`Stock: ${producto.stock_actual_producto} | Mínimo: ${producto.stock_minimo_producto}`}>
            <Chip
              label={producto.stock_actual_producto}
              size="small"
              color={stockColor}
            />
          </Tooltip>
          <LinearProgress
            variant="determinate"
            value={Math.min((producto.stock_actual_producto / Math.max(producto.stock_minimo_producto, 1)) * 100, 100)}
            color={stockColor}
            sx={{ width: 50, height: 6, borderRadius: 3 }}
          />
        </Box>
      </TableCell>
      <TableCell>
        {producto.ubicacion_producto ? (
          <Chip
            icon={<LocationIcon />}
            label={producto.ubicacion_producto}
            size="small"
            variant="outlined"
          />
        ) : (
          <Typography variant="caption" color="textSecondary">
            Sin ubicación
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip
          label={producto.activo_producto ? 'Activo' : 'Inactivo'}
          color={producto.activo_producto ? 'success' : 'default'}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Tooltip title={formatDateUtil(producto.fecha_creacion_producto)}>
          <Chip
            label={formatDateUtil(producto.fecha_creacion_producto)}
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
              onClick={() => onView(producto)}
              size="small"
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              color="primary"
              onClick={() => onEdit(producto)}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              color="error"
              onClick={() => onDelete(producto)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
});

// Componente de Diálogo de Vista de Producto
const ProductoViewDialog = memo(({ open, onClose, producto, categorias, unidades, onExport }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  if (!producto) return null;

  const categoriaNombre = categorias.find(c => c.id_categoria === producto.id_categoria)?.nombre_categoria || 'N/A';
  const unidadInfo = unidades.find(u => u.id_unidad_medida === producto.id_unidad_medida);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'info.main' }}>
            <ProductIcon />
          </Avatar>
          <Typography variant="h6">
            Detalles del Producto
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <ClearIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Información General */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
              Información General
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Nombre del Producto
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {producto.nombre_producto}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                SKU
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {producto.sku_producto}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Descripción
              </Typography>
              <Typography variant="body1">
                {producto.descripcion_producto || 'Sin descripción'}
              </Typography>
            </Paper>
          </Grid>

          {/* Clasificación */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ mt: 2 }}>
              Clasificación
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Categoría
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon color="primary" fontSize="small" />
                <Typography variant="body1">
                  {categoriaNombre}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Unidad de Medida
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UnitIcon color="primary" fontSize="small" />
                <Typography variant="body1">
                  {unidadInfo?.nombre_unidad} ({unidadInfo?.simbolo_unidad})
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Inventario */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ mt: 2 }}>
              Inventario
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Stock Actual
              </Typography>
              <Typography variant="h5" color={
                producto.stock_actual_producto <= 0 ? 'error' :
                producto.stock_actual_producto <= producto.stock_minimo_producto ? 'warning' : 'success'
              }>
                {producto.stock_actual_producto}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Stock Mínimo
              </Typography>
              <Typography variant="h6">
                {producto.stock_minimo_producto}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Stock Máximo
              </Typography>
              <Typography variant="h6">
                {producto.stock_maximo_producto || 'No definido'}
              </Typography>
            </Paper>
          </Grid>

          {/* Ubicación */}
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Ubicación
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" fontSize="small" />
                <Typography variant="body1">
                  {producto.ubicacion_producto || 'Sin ubicación asignada'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Estado
              </Typography>
              <Chip
                label={producto.activo_producto ? 'Activo' : 'Inactivo'}
                color={producto.activo_producto ? 'success' : 'default'}
                size="small"
              />
            </Paper>
          </Grid>

          {/* Fechas */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ mt: 2 }}>
              Fechas
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Fecha de Creación
              </Typography>
              <Typography variant="body1">
                {formatDateUtil(producto.fecha_creacion_producto)}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Última Actualización
              </Typography>
              <Typography variant="body1">
                {formatDateUtil(producto.fecha_actualizacion_producto)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
        <Button
          variant="contained"
          color="info"
          startIcon={<DownloadIcon />}
          onClick={() => onExport(producto)}
        >
          Exportar Información
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// Componente Principal
const ProductosCRUD = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Estados
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de paginación
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    search: '',
    categoria: 'todas',
    unidad: 'todas',
    estado: 'todos',
    stockBajo: false,
    fechaInicio: null,
    fechaFin: null
  });
  
  const [appliedFilters, setAppliedFilters] = useState(filters);
  
  // Estados de UI
  const [anchorElExport, setAnchorElExport] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre_producto: '',
    sku_producto: '',
    descripcion_producto: '',
    stock_minimo_producto: 0,
    stock_maximo_producto: '',
    ubicacion_producto: '',
    imagen_url_producto: '',
    activo_producto: true,
    id_categoria: '',
    id_unidad_medida: ''
  });
  
  const [formErrors, setFormErrors] = useState({});

  const getHeaders = () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Carga inicial de datos
  useEffect(() => {
    loadInitialData();
  }, []);

  // Efecto para aplicar filtros
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setAppliedFilters(filters);
      resetPagination();
      fetchProductos(1, filters);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriasRes, unidadesRes, productosRes] = await Promise.all([
        fetch(CATEGORIAS_URL, { headers: getHeaders() }).then(res => res.json()),
        fetch(UNIDADES_URL, { headers: getHeaders() }).then(res => res.json()),
        fetch(`${API_URL}?page=1`, { headers: getHeaders() }).then(res => res.json())
      ]);

      setCategorias(categoriasRes.results || categoriasRes);
      setUnidades(unidadesRes.results || unidadesRes);
      
      const productosData = productosRes.results || [];
      setProductos(productosData);
      setFilteredProductos(productosData);
      setTotalCount(productosRes.count || 0);
      setNextPage(productosRes.next);
      setPrevPage(productosRes.previous);
      setHasMore(!!productosRes.next);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Error al cargar los datos iniciales');
      showSnackbar('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async (pageNum = page, currentFilters = appliedFilters) => {
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pageNum);
      
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.categoria !== 'todas') params.append('categoria', currentFilters.categoria);
      if (currentFilters.unidad !== 'todas') params.append('unidad', currentFilters.unidad);
      if (currentFilters.estado !== 'todos') params.append('activo', currentFilters.estado === 'activo');
      if (currentFilters.stockBajo) params.append('stock_bajo', 'true');
      
      const url = `${API_URL}?${params.toString()}`;
      console.log('Fetching:', url);
      
      const response = await fetch(url, { headers: getHeaders() });
      if (!response.ok) throw new Error('Error al cargar productos');
      
      const data = await response.json();
      
      const enrichedData = (data.results || []).map(producto => ({
        ...producto,
        categoria_nombre: getCategoriaNombre(producto.id_categoria),
        unidad_nombre: getUnidadNombre(producto.id_unidad_medida)
      }));

      if (pageNum === 1) {
        setProductos(enrichedData);
        setFilteredProductos(enrichedData);
      } else {
        setProductos(prev => [...prev, ...enrichedData]);
        setFilteredProductos(prev => [...prev, ...enrichedData]);
      }
      
      setTotalCount(data.count || 0);
      setNextPage(data.next);
      setPrevPage(data.previous);
      setHasMore(!!data.next);
      setPage(pageNum);
      
    } catch (error) {
      console.error('Error fetching productos:', error);
      showSnackbar('Error al cargar productos', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchProductos(page + 1);
    }
  };

  const resetPagination = () => {
    setPage(1);
    setProductos([]);
    setFilteredProductos([]);
    setHasMore(false);
  };

  const getCategoriaNombre = useCallback((id) => {
    const categoria = categorias.find(c => c.id_categoria === id);
    return categoria ? categoria.nombre_categoria : id;
  }, [categorias]);

  const getUnidadNombre = useCallback((id) => {
    const unidad = unidades.find(u => u.id_unidad_medida === id);
    return unidad ? `${unidad.nombre_unidad} (${unidad.simbolo_unidad})` : id;
  }, [unidades]);

  // CRUD Operations
  const createProducto = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(formatFormData())
      });
      
      if (!response.ok) throw new Error('Error al crear el producto');
      
      showSnackbar('Producto creado exitosamente', 'success');
      handleCloseDialog();
      resetPagination();
      await fetchProductos(1, appliedFilters);
      
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const updateProducto = async () => {
    if (!validateForm()) return;
    
    setLoadingAction(true);
    try {
      const response = await fetch(`${API_URL}${selectedProducto.id_producto}/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(formatFormData())
      });
      
      if (!response.ok) throw new Error('Error al actualizar el producto');
      
      showSnackbar('Producto actualizado exitosamente', 'success');
      handleCloseDialog();
      await fetchProductos(page, appliedFilters);
      
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const deleteProducto = async () => {
    setLoadingAction(true);
    try {
      const response = await fetch(`${API_URL}${selectedProducto.id_producto}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (!response.ok) throw new Error('Error al eliminar el producto');
      
      showSnackbar('Producto eliminado exitosamente', 'success');
      setOpenDeleteDialog(false);
      
      if (productos.length === 1 && page > 1) {
        await fetchProductos(page - 1, appliedFilters);
      } else {
        await fetchProductos(page, appliedFilters);
      }
      
    } catch (error) {
      showSnackbar(error.message, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const formatFormData = () => ({
    nombre_producto: formData.nombre_producto,
    sku_producto: formData.sku_producto,
    descripcion_producto: formData.descripcion_producto || null,
    stock_minimo_producto: parseInt(formData.stock_minimo_producto) || 0,
    stock_maximo_producto: formData.stock_maximo_producto ? parseInt(formData.stock_maximo_producto) : null,
    ubicacion_producto: formData.ubicacion_producto || null,
    imagen_url_producto: formData.imagen_url_producto || null,
    activo_producto: formData.activo_producto,
    id_categoria: parseInt(formData.id_categoria),
    id_unidad_medida: parseInt(formData.id_unidad_medida),
    fecha_creacion_producto: selectedProducto?.fecha_creacion_producto || new Date().toISOString().split('T')[0]
  });

  // Validación
  const validateForm = () => {
    const errors = {};
    if (!formData.nombre_producto?.trim()) errors.nombre_producto = 'Nombre requerido';
    if (!formData.sku_producto?.trim()) errors.sku_producto = 'SKU requerido';
    if (!formData.id_categoria) errors.id_categoria = 'Categoría requerida';
    if (!formData.id_unidad_medida) errors.id_unidad_medida = 'Unidad requerida';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handlers
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleViewProduct = (producto) => {
    setSelectedProducto(producto);
    setOpenViewDialog(true);
  };

  const handleExportProduct = (producto) => {
    ExportUtils.toJSON([producto], `producto_${producto.sku_producto}_${new Date().toISOString().split('T')[0]}`);
    showSnackbar('Información del producto exportada', 'success');
  };

  const handleExportAll = (format) => {
    const filename = `productos_${new Date().toISOString().split('T')[0]}`;
    
    switch(format) {
      case 'csv':
        ExportUtils.toCSV(productos, filename);
        break;
      case 'json':
        ExportUtils.toJSON(productos, filename);
        break;
    }
    
    showSnackbar(`Archivo ${format.toUpperCase()} exportado`, 'success');
    handleCloseExportMenu();
  };

  const handleCloseExportMenu = () => {
    setAnchorElExport(null);
  };

  const handleOpenCreateDialog = () => {
    setSelectedProducto(null);
    setFormData({
      nombre_producto: '',
      sku_producto: '',
      descripcion_producto: '',
      stock_minimo_producto: 0,
      stock_maximo_producto: '',
      ubicacion_producto: '',
      imagen_url_producto: '',
      activo_producto: true,
      id_categoria: '',
      id_unidad_medida: ''
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProducto(null);
    setFormData({
      nombre_producto: '',
      sku_producto: '',
      descripcion_producto: '',
      stock_minimo_producto: 0,
      stock_maximo_producto: '',
      ubicacion_producto: '',
      imagen_url_producto: '',
      activo_producto: true,
      id_categoria: '',
      id_unidad_medida: ''
    });
    setFormErrors({});
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

  const clearFilters = () => {
    setFilters({
      search: '',
      categoria: 'todas',
      unidad: 'todas',
      estado: 'todos',
      stockBajo: false,
      fechaInicio: null,
      fechaFin: null
    });
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'fechaInicio' || key === 'fechaFin') return value !== null;
      if (key === 'stockBajo') return value;
      return value !== 'todas' && value !== 'todos' && value !== '';
    });
  };

  // Stats memoizados
  const stats = useMemo(() => ({
    total: productos.length,
    stockBajo: productos.filter(p => p.stock_actual_producto <= p.stock_minimo_producto && p.stock_actual_producto > 0).length,
    sinStock: productos.filter(p => p.stock_actual_producto <= 0).length
  }), [productos]);

  // Render
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <WarningIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error" gutterBottom>
            Error al cargar los datos
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {error}
          </Typography>
          <Button variant="contained" onClick={loadInitialData}>
            Reintentar
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Backdrop sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1 }} open={loadingAction}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Header */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <ProductIcon />
            </Avatar>
            <Typography variant="h5" component="h1">
              Productos
            </Typography>
            <Chip 
              label={`${totalCount} total`} 
              size="small" 
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={(e) => setAnchorElExport(e.currentTarget)}
              disabled={productos.length === 0}
              size={isMobile ? 'small' : 'medium'}
            >
              Exportar
            </Button>
            
            <Menu
              anchorEl={anchorElExport}
              open={Boolean(anchorElExport)}
              onClose={handleCloseExportMenu}
            >
              <MenuItem onClick={() => handleExportAll('csv')}>
                <ListItemIcon><ExcelIcon fontSize="small" color="success" /></ListItemIcon>
                <ListItemText>Exportar a CSV</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportAll('json')}>
                <ListItemIcon><PdfIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText>Exportar a JSON</ListItemText>
              </MenuItem>
            </Menu>
            
            <Tooltip title="Refrescar">
              <IconButton onClick={loadInitialData} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              size={isMobile ? 'small' : 'medium'}
            >
              Nuevo Producto
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" variant="body2">En esta página</Typography>
                    <Typography variant="h4">{productos.length}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <ProductIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card variant="outlined" sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="warning.dark" variant="body2">Stock Bajo</Typography>
                    <Typography variant="h4" color="warning.dark">{stats.stockBajo}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <StockWarningIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card variant="outlined" sx={{ bgcolor: 'error.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="error.dark" variant="body2">Sin Stock</Typography>
                    <Typography variant="h4" color="error.dark">{stats.sinStock}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <WarningIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Box sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setFilters(prev => ({ ...prev, search: '' }))}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filters.categoria}
                  label="Categoría"
                  onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.target.value }))}
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  {categorias.map(cat => (
                    <MenuItem key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Unidad</InputLabel>
                <Select
                  value={filters.unidad}
                  label="Unidad"
                  onChange={(e) => setFilters(prev => ({ ...prev, unidad: e.target.value }))}
                >
                  <MenuItem value="todas">Todas</MenuItem>
                  {unidades.map(uni => (
                    <MenuItem key={uni.id_unidad_medida} value={uni.id_unidad_medida}>
                      {uni.nombre_unidad}
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
                  onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="activo">Activos</MenuItem>
                  <MenuItem value="inactivo">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.stockBajo}
                    onChange={(e) => setFilters(prev => ({ ...prev, stockBajo: e.target.checked }))}
                  />
                }
                label="Stock bajo"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
            {hasActiveFilters() && (
              <Badge color="secondary" variant="dot">
                <Button size="small" startIcon={<FilterIcon />} color="primary" variant="outlined">
                  Filtros activos
                </Button>
              </Badge>
            )}
            <Button size="small" startIcon={<ClearIcon />} onClick={clearFilters}>
              Limpiar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabla */}
      <Paper elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white' }}>ID</TableCell>
                <TableCell sx={{ color: 'white' }}>SKU</TableCell>
                <TableCell sx={{ color: 'white' }}>Nombre</TableCell>
                <TableCell sx={{ color: 'white' }}>Categoría</TableCell>
                <TableCell sx={{ color: 'white' }}>Unidad</TableCell>
                <TableCell sx={{ color: 'white' }}>Stock</TableCell>
                <TableCell sx={{ color: 'white' }}>Ubicación</TableCell>
                <TableCell sx={{ color: 'white' }}>Estado</TableCell>
                <TableCell sx={{ color: 'white' }}>Creación</TableCell>
                <TableCell sx={{ color: 'white' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(10)].map((_, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                    <ProductIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No hay productos
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenCreateDialog}
                    >
                      Crear producto
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                productos.map(producto => (
                  <ProductoRow
                    key={producto.id_producto}
                    producto={producto}
                    onView={handleViewProduct}
                    onEdit={() => {
                      setSelectedProducto(producto);
                      setFormData({
                        nombre_producto: producto.nombre_producto,
                        sku_producto: producto.sku_producto,
                        descripcion_producto: producto.descripcion_producto || '',
                        stock_minimo_producto: producto.stock_minimo_producto,
                        stock_maximo_producto: producto.stock_maximo_producto || '',
                        ubicacion_producto: producto.ubicacion_producto || '',
                        imagen_url_producto: producto.imagen_url_producto || '',
                        activo_producto: producto.activo_producto,
                        id_categoria: producto.id_categoria,
                        id_unidad_medida: producto.id_unidad_medida
                      });
                      setOpenDialog(true);
                    }}
                    onDelete={() => {
                      setSelectedProducto(producto);
                      setOpenDeleteDialog(true);
                    }}
                    categorias={categorias}
                    unidades={unidades}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Controles de paginación */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Mostrando {productos.length} de {totalCount} productos
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              disabled={!prevPage || loadingMore}
              onClick={() => fetchProductos(page - 1)}
            >
              Anterior
            </Button>
            
            <Typography variant="body2">
              Página {page} de {Math.ceil(totalCount / rowsPerPage)}
            </Typography>
            
            <Button
              size="small"
              variant="outlined"
              disabled={!hasMore || loadingMore}
              onClick={loadMore}
              endIcon={loadingMore && <CircularProgress size={16} />}
            >
              {loadingMore ? 'Cargando...' : 'Siguiente'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Diálogos */}
      <ProductoViewDialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        producto={selectedProducto}
        categorias={categorias}
        unidades={unidades}
        onExport={handleExportProduct}
      />

      {/* Diálogo de Crear/Editar */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre *"
                name="nombre_producto"
                value={formData.nombre_producto}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.nombre_producto}
                helperText={formErrors.nombre_producto}
                disabled={loadingAction}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="SKU *"
                name="sku_producto"
                value={formData.sku_producto}
                onChange={handleInputChange}
                fullWidth
                error={!!formErrors.sku_producto}
                helperText={formErrors.sku_producto}
                disabled={loadingAction}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                name="descripcion_producto"
                value={formData.descripcion_producto}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={loadingAction}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" error={!!formErrors.id_categoria}>
                <InputLabel>Categoría *</InputLabel>
                <Select
                  name="id_categoria"
                  value={formData.id_categoria}
                  label="Categoría *"
                  onChange={handleInputChange}
                  disabled={loadingAction}
                >
                  {categorias.map(cat => (
                    <MenuItem key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.id_categoria && (
                  <FormHelperText>{formErrors.id_categoria}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small" error={!!formErrors.id_unidad_medida}>
                <InputLabel>Unidad *</InputLabel>
                <Select
                  name="id_unidad_medida"
                  value={formData.id_unidad_medida}
                  label="Unidad *"
                  onChange={handleInputChange}
                  disabled={loadingAction}
                >
                  {unidades.map(uni => (
                    <MenuItem key={uni.id_unidad_medida} value={uni.id_unidad_medida}>
                      {uni.nombre_unidad} ({uni.simbolo_unidad})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.id_unidad_medida && (
                  <FormHelperText>{formErrors.id_unidad_medida}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                label="Ubicación"
                name="ubicacion_producto"
                value={formData.ubicacion_producto}
                onChange={handleInputChange}
                fullWidth
                disabled={loadingAction}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Stock Mínimo"
                name="stock_minimo_producto"
                type="number"
                value={formData.stock_minimo_producto}
                onChange={handleNumberChange}
                fullWidth
                disabled={loadingAction}
                size="small"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                label="Stock Máximo"
                name="stock_maximo_producto"
                type="number"
                value={formData.stock_maximo_producto}
                onChange={handleNumberChange}
                fullWidth
                disabled={loadingAction}
                size="small"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="URL de Imagen"
                name="imagen_url_producto"
                value={formData.imagen_url_producto}
                onChange={handleInputChange}
                fullWidth
                disabled={loadingAction}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo_producto}
                    onChange={(e) => setFormData(prev => ({ ...prev, activo_producto: e.target.checked }))}
                    disabled={loadingAction}
                  />
                }
                label="Producto activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loadingAction}>
            Cancelar
          </Button>
          <Button 
            onClick={selectedProducto ? updateProducto : createProducto}
            variant="contained"
            disabled={loadingAction}
            startIcon={loadingAction && <CircularProgress size={20} />}
          >
            {loadingAction ? 'Guardando...' : (selectedProducto ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color="error">
            Confirmar Eliminación
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            ¿Estás seguro de eliminar el producto?
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {selectedProducto?.nombre_producto}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              SKU: {selectedProducto?.sku_producto}
            </Typography>
          </Paper>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={loadingAction}>
            Cancelar
          </Button>
          <Button 
            onClick={deleteProducto} 
            variant="contained" 
            color="error"
            disabled={loadingAction}
            startIcon={loadingAction && <CircularProgress size={20} />}
          >
            {loadingAction ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductosCRUD;