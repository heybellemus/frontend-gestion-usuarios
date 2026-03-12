import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Activity,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const operacionesData = [
  {
    id: 1,
    usuario: 'Juan Pérez',
    fechaOperacion: '2024-12-15 14:30:25',
    tablaAfectada: 'Clientes',
    operacion: 'UPDATE',
    registroId: 'CLI-001',
    valoresAnteriores: '{"email": "old@email.com"}',
    valoresNuevos: '{"email": "new@email.com"}',
  },
  {
    id: 2,
    usuario: 'María García',
    fechaOperacion: '2024-12-15 13:15:10',
    tablaAfectada: 'Usuarios',
    operacion: 'INSERT',
    registroId: 'USR-048',
    valoresAnteriores: null,
    valoresNuevos: '{"nombre": "Carlos López"}',
  },
  {
    id: 3,
    usuario: 'Admin',
    fechaOperacion: '2024-12-15 12:00:00',
    tablaAfectada: 'Roles',
    operacion: 'DELETE',
    registroId: 'ROL-005',
    valoresAnteriores: '{"nombre": "Temporal"}',
    valoresNuevos: null,
  },
  {
    id: 4,
    usuario: 'Ana Martínez',
    fechaOperacion: '2024-12-15 11:45:30',
    tablaAfectada: 'ContactosClientes',
    operacion: 'INSERT',
    registroId: 'CON-123',
    valoresAnteriores: null,
    valoresNuevos: '{"nombre": "Pedro Sánchez"}',
  },
];

const accesosData = [
  {
    id: 1,
    usuario: 'Juan Pérez',
    fechaAcceso: '2024-12-15 14:30:00',
    tipoAccion: 'LOGIN',
    direccionIP: '192.168.1.100',
    navegador: 'Chrome 120.0',
    exitoso: true,
  },
  {
    id: 2,
    usuario: 'María García',
    fechaAcceso: '2024-12-15 13:00:00',
    tipoAccion: 'LOGOUT',
    direccionIP: '192.168.1.105',
    navegador: 'Firefox 121.0',
    exitoso: true,
  },
  {
    id: 3,
    usuario: 'carlos.lopez',
    fechaAcceso: '2024-12-15 12:30:00',
    tipoAccion: 'LOGIN',
    direccionIP: '192.168.1.200',
    navegador: 'Safari 17.2',
    exitoso: false,
  },
  {
    id: 4,
    usuario: 'Ana Martínez',
    fechaAcceso: '2024-12-15 11:00:00',
    tipoAccion: 'LOGIN',
    direccionIP: '192.168.1.110',
    navegador: 'Edge 120.0',
    exitoso: true,
  },
];

const getOperacionIcon = (operacion) => {
  switch (operacion) {
    case 'INSERT':
      return <Plus className="w-4 h-4 text-success" />;
    case 'UPDATE':
      return <Edit className="w-4 h-4 text-warning" />;
    case 'DELETE':
      return <Trash2 className="w-4 h-4 text-destructive" />;
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
};

const getOperacionBadge = (operacion) => {
  switch (operacion) {
    case 'INSERT':
      return 'badge-success';
    case 'UPDATE':
      return 'badge-warning';
    case 'DELETE':
      return 'badge-danger';
    default:
      return '';
  }
};

const Auditoria = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Auditoría</h1>
          <p className="page-subtitle">Registro de operaciones y accesos al sistema</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      <Tabs defaultValue="operaciones" className="space-y-6">
        <TabsList>
          <TabsTrigger value="operaciones" className="gap-2">
            <Activity className="w-4 h-4" />
            Operaciones
          </TabsTrigger>
          <TabsTrigger value="accesos" className="gap-2">
            <LogIn className="w-4 h-4" />
            Accesos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operaciones" className="space-y-6">
          {/* Filters */}
          <div className="dashboard-card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, tabla o registro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha
                </Button>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </div>

          {/* Operaciones Table */}
          <div className="dashboard-card p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Usuario</th>
                    <th>Operación</th>
                    <th>Tabla</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {operacionesData.map((op) => (
                    <tr key={op.id}>
                      <td className="text-muted-foreground whitespace-nowrap">
                        {op.fechaOperacion}
                      </td>
                      <td className="font-medium text-foreground">{op.usuario}</td>
                      <td>
                        <span className={`badge ${getOperacionBadge(op.operacion)}`}>
                          {getOperacionIcon(op.operacion)}
                          <span className="ml-1">{op.operacion}</span>
                        </span>
                      </td>
                      <td className="text-muted-foreground">{op.tablaAfectada}</td>
                      <td className="text-muted-foreground font-mono text-xs">
                        {op.registroId}
                      </td>
                      <td>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accesos" className="space-y-6">
          {/* Filters */}
          <div className="dashboard-card">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario o IP..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Fecha
                </Button>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </div>

          {/* Accesos Table */}
          <div className="dashboard-card p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Dirección IP</th>
                    <th>Navegador</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {accesosData.map((acceso) => (
                    <tr key={acceso.id}>
                      <td className="text-muted-foreground whitespace-nowrap">
                        {acceso.fechaAcceso}
                      </td>
                      <td className="font-medium text-foreground">{acceso.usuario}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {acceso.tipoAccion === 'LOGIN' ? (
                            <LogIn className="w-4 h-4 text-success" />
                          ) : (
                            <LogOut className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">{acceso.tipoAccion}</span>
                        </div>
                      </td>
                      <td className="text-muted-foreground font-mono text-xs">
                        {acceso.direccionIP}
                      </td>
                      <td className="text-muted-foreground text-xs">{acceso.navegador}</td>
                      <td>
                        <span
                          className={`badge ${
                            acceso.exitoso ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {acceso.exitoso ? 'Exitoso' : 'Fallido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Auditoria;
