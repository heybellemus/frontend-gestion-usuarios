import React from 'react';
import {
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from 'lucide-react';

const stats = [
  {
    name: 'Total Clientes',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'bg-primary',
  },
  {
    name: 'Usuarios Activos',
    value: '48',
    change: '+3.2%',
    trend: 'up',
    icon: UserCheck,
    color: 'bg-success',
  },
  {
    name: 'Departamentos',
    value: '12',
    change: '0%',
    trend: 'neutral',
    icon: Building2,
    color: 'bg-warning',
  },
  {
    name: 'Operaciones Hoy',
    value: '1,294',
    change: '-2.4%',
    trend: 'down',
    icon: TrendingUp,
    color: 'bg-accent',
  },
];

const recentClients = [
  { id: 1, nombre: 'Empresa ABC S.A.', documento: '20123456789', email: 'contacto@abc.com', estado: 'Activo' },
  { id: 2, nombre: 'Tech Solutions', documento: '20987654321', email: 'info@tech.com', estado: 'Activo' },
  { id: 3, nombre: 'Global Corp', documento: '20555666777', email: 'admin@global.com', estado: 'Inactivo' },
  { id: 4, nombre: 'Inversiones XYZ', documento: '20111222333', email: 'ventas@xyz.com', estado: 'Activo' },
  { id: 5, nombre: 'Comercial Delta', documento: '20444555666', email: 'delta@comercial.com', estado: 'Pendiente' },
];

const recentActivity = [
  { id: 1, usuario: 'Juan Pérez', accion: 'Creó nuevo cliente', tiempo: 'Hace 5 min' },
  { id: 2, usuario: 'María García', accion: 'Actualizó permisos', tiempo: 'Hace 15 min' },
  { id: 3, usuario: 'Carlos López', accion: 'Eliminó contacto', tiempo: 'Hace 30 min' },
  { id: 4, usuario: 'Ana Martínez', accion: 'Modificó usuario', tiempo: 'Hace 1 hora' },
];

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Bienvenido al sistema de gestión de clientes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{stat.name}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <span
                  className={`text-xs font-medium flex items-center ${
                    stat.trend === 'up'
                      ? 'text-success'
                      : stat.trend === 'down'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {stat.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                  {stat.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Clients */}
        <div className="lg:col-span-2 dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Clientes Recientes</h2>
            <button className="p-1 rounded hover:bg-muted transition-colors">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Email</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map((client) => (
                  <tr key={client.id}>
                    <td className="font-medium text-foreground">{client.nombre}</td>
                    <td className="text-muted-foreground">{client.documento}</td>
                    <td className="text-muted-foreground">{client.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          client.estado === 'Activo'
                            ? 'badge-success'
                            : client.estado === 'Inactivo'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {client.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Actividad Reciente</h2>
            <button className="p-1 rounded hover:bg-muted transition-colors">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">
                    {activity.usuario.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.usuario}</p>
                  <p className="text-xs text-muted-foreground">{activity.accion}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.tiempo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
