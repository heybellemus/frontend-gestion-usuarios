import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const API_BASE = 'http://127.0.0.1:8000/api';

const RESOURCES = [
  { key: 'productos', label: 'Menu Productos', path: 'menu-productos', canEdit: false },
  { key: 'categorias', label: 'Menu Categorias', path: 'menu-categorias', canEdit: true },
  { key: 'unidades', label: 'Menu Unidades Medida', path: 'menu-unidades-medida', canEdit: false },
  { key: 'lotes', label: 'Menu Lotes', path: 'menu-lotes', canEdit: false },
  { key: 'movimientos', label: 'Menu Movimientos', path: 'cat-tipos-movimiento', canEdit: false },
  { key: 'historial', label: 'Menu Historial Precios', path: 'cat-tipos-movimiento', canEdit: false },
  { key: 'proveedores', label: 'Menu Proveedores', path: 'menu-proveedores', canEdit: false },
  { key: 'clientes', label: 'Menu Clientes', path: 'clientes', canEdit: false },
  { key: 'departamentos', label: 'Menu Departamentos', path: 'departamentos', canEdit: false },
  { key: 'roles', label: 'Menu Roles', path: 'roles', canEdit: false }
];

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const getRecordId = (item) =>
  item?.id ??
  item?.categoriaid ??
  item?.categoria_id ??
  item?.menucategoriaid ??
  item?.menu_categoria_id ??
  null;

const MenuMaestros = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [rowsByResource, setRowsByResource] = useState({});
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [createPayload, setCreatePayload] = useState('{\n  \n}');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editPayload, setEditPayload] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const activeResource = RESOURCES[tabIndex];
  const activeRows = rowsByResource[activeResource.key] || [];

  const visibleColumns = useMemo(() => {
    if (!activeRows.length) return [];
    return Object.keys(activeRows[0]).slice(0, 5);
  }, [activeRows]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchResource = async (resource) => {
    const response = await fetch(`${API_BASE}/${resource.path}/`, { headers: getAuthHeaders() });
    if (!response.ok) {
      throw new Error(`Error ${response.status} al consultar ${resource.label}`);
    }
    const data = await response.json();
    setRowsByResource((prev) => ({ ...prev, [resource.key]: normalizeList(data) }));
  };

  const loadActiveResource = async () => {
    setLoading(true);
    setRequestError('');
    try {
      await fetchResource(activeResource);
    } catch (error) {
      setRequestError(error.message || 'No se pudo cargar la informacion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveResource();
  }, [activeResource.key]);

  const handleCreate = async () => {
    let body;
    try {
      body = JSON.parse(createPayload);
    } catch {
      showSnackbar('El JSON del formulario no es valido', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${activeResource.path}/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error ${response.status} al crear`);
      }
      await loadActiveResource();
      showSnackbar(`Registro creado en ${activeResource.label}`);
    } catch (error) {
      showSnackbar(error.message || 'No se pudo crear el registro', 'error');
    }
  };

  const handleOpenEdit = (item) => {
    setSelectedCategory(item);
    setEditPayload(JSON.stringify(item, null, 2));
    setOpenEditDialog(true);
  };

  const handleSaveCategory = async () => {
    const id = getRecordId(selectedCategory);
    if (!id) {
      showSnackbar('No se encontro un id valido para la categoria', 'error');
      return;
    }

    let body;
    try {
      body = JSON.parse(editPayload);
    } catch {
      showSnackbar('El JSON de edicion no es valido', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/menu-categorias/${id}/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error ${response.status} al actualizar`);
      }
      setOpenEditDialog(false);
      await loadActiveResource();
      showSnackbar('Categoria actualizada correctamente');
    } catch (error) {
      showSnackbar(error.message || 'No se pudo actualizar la categoria', 'error');
    }
  };

  const handleDeleteCategory = async (item) => {
    const id = getRecordId(item);
    if (!id) {
      showSnackbar('No se encontro un id valido para la categoria', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/menu-categorias/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Error ${response.status} al eliminar`);
      }
      await loadActiveResource();
      showSnackbar('Categoria eliminada correctamente');
    } catch (error) {
      showSnackbar(error.message || 'No se pudo eliminar la categoria', 'error');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4">Gestion Menu - Endpoints DRF</Typography>
      <Typography variant="body2" color="text.secondary">
        En cada pestaña puedes consultar y crear registros. En categorias tambien puedes editar y eliminar.
      </Typography>

      <Paper sx={{ p: 1 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, value) => setTabIndex(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {RESOURCES.map((resource) => (
            <Tab key={resource.key} label={resource.label} />
          ))}
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Crear en {activeResource.label} (POST /{activeResource.path}/)
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={6}
          value={createPayload}
          onChange={(e) => setCreatePayload(e.target.value)}
          placeholder='{"campo":"valor"}'
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Crear Registro
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadActiveResource}>
            Recargar Lista
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6">Listado de {activeResource.label}</Typography>
          <Typography variant="body2" color="text.secondary">
            GET /{activeResource.path}/
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : requestError ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{requestError}</Alert>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableCell key={column}>{column}</TableCell>
                  ))}
                  <TableCell>JSON</TableCell>
                  {activeResource.canEdit && <TableCell>Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {activeRows.map((row, index) => (
                  <TableRow key={getRecordId(row) || index} hover>
                    {visibleColumns.map((column) => (
                      <TableCell key={column}>{String(row[column] ?? '')}</TableCell>
                    ))}
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{ whiteSpace: 'pre-wrap', m: 0 }}
                      >
                        {JSON.stringify(row, null, 2)}
                      </Typography>
                    </TableCell>
                    {activeResource.canEdit && (
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEdit(row)}
                          sx={{ mr: 1 }}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteCategory(row)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {activeRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={activeResource.canEdit ? visibleColumns.length + 2 : visibleColumns.length + 1}>
                      <Typography variant="body2" color="text.secondary">
                        No hay registros en este endpoint.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Categoria</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={10}
            value={editPayload}
            onChange={(e) => setEditPayload(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveCategory}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MenuMaestros;
