
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Usuarios from "./pages/Usuarios";
import Departamentos from "./pages/Departamentos";
import Roles from "./pages/Roles";
import RolPermisos from "./pages/RolPermisos";
import Auditoria from "./pages/Auditoria";
import Permisos from "./pages/Permisos";
import NotFound from "./pages/NotFound";
import QRLogin from "./pages/QRLogin";
import QRScannerMobile from "./pages/QRScannerMobile";
import RBACRoute from "./components/RBACRoute";
// Nuevas páginas de administración RBAC
import AdminPanel from "./pages/AdminPanel";
import PantallasAdmin from "./pages/PantallasAdmin";
import RolesAdmin from "./pages/RolesAdmin";
import RolPantallasAdmin from "./pages/RolPantallasAdmin";
import VerificacionAcceso from "./pages/VerificacionAcceso";
import GestionPantallasRol from "./pages/GestionPantallasRol";
import MenuMaestros from "./pages/MenuMaestros";
import CategoriasCRUD from "./pages/menu/categorias";
import UnidadesMedidaCRUD from "./pages/menu/unidadesmedidas";
import ProductosCRUD from "./pages/menu/productos";
import LotesCRUD from "./pages/menu/lotes";
import ProveedoresCRUD from "./pages/menu/proveedores";
import TiposMovimientosCRUD from "./pages/menu/tiposmovimientos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/QRLogin" element={<QRLogin />} />
          
          {/* Rutas protegidas */}
          <Route path="/" element={<RBACRoute authOnly><DashboardLayout /></RBACRoute>}>
            <Route path="dashboard" element={<RBACRoute><Dashboard /></RBACRoute>} />
            <Route path="clientes" element={<RBACRoute><Clientes /></RBACRoute>} />
            <Route path="usuarios" element={<RBACRoute><Usuarios /></RBACRoute>} />
            <Route path="departamentos" element={<RBACRoute><Departamentos /></RBACRoute>} />
            <Route path="roles" element={<RBACRoute><Roles /></RBACRoute>} />
            <Route path="auditoria" element={<RBACRoute><Auditoria /></RBACRoute>} />
            <Route path="permisos" element={<RBACRoute><Permisos /></RBACRoute>} />
            <Route path="rolpermisos" element={<RBACRoute><RolPermisos /></RBACRoute>} />
            <Route path="qr-movil" element={<RBACRoute><QRScannerMobile /></RBACRoute>} />
            
            {/* Nuevas rutas de administración RBAC */}
            <Route path="admin-panel" element={<RBACRoute requireAdmin><AdminPanel /></RBACRoute>} />
            <Route path="pantallas-admin" element={<RBACRoute requireAdmin><PantallasAdmin /></RBACRoute>} />
            <Route path="roles-admin" element={<RBACRoute requireAdmin><RolesAdmin /></RBACRoute>} />
            <Route path="rolpantallas-admin" element={<RBACRoute requireAdmin><RolPantallasAdmin /></RBACRoute>} />
            <Route path="verificacion-acceso" element={<RBACRoute requireAdmin><VerificacionAcceso /></RBACRoute>} />
            <Route path="gestion-pantallas-rol" element={<RBACRoute requireAdmin><GestionPantallasRol /></RBACRoute>} />
            <Route path="menu-maestros" element={<RBACRoute requireAdmin><MenuMaestros /></RBACRoute>} />

            {/* Rutas de menú */}
            <Route path="menu-categorias" element={<RBACRoute requireAdmin><CategoriasCRUD /></RBACRoute>} />
            <Route path="menu-unidades-medidas" element={<RBACRoute requireAdmin><UnidadesMedidaCRUD /></RBACRoute>} />
            <Route path="menu-productos" element={<RBACRoute requireAdmin><ProductosCRUD /></RBACRoute>} />
            <Route path="menu-lotes" element={<RBACRoute requireAdmin><LotesCRUD /></RBACRoute>} />
            <Route path="menu-proveedores" element={<RBACRoute requireAdmin><ProveedoresCRUD /></RBACRoute>} />
            <Route path="menu-tipos-movimientos" element={<RBACRoute requireAdmin><TiposMovimientosCRUD /></RBACRoute>} />
            <Route path="menu-clientes" element={<RBACRoute requireAdmin><Clientes /></RBACRoute>} />
            <Route path="menu-departamentos" element={<RBACRoute requireAdmin><Departamentos /></RBACRoute>} />
            <Route path="menu-roles" element={<RBACRoute requireAdmin><Roles /></RBACRoute>} />
            
          
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);



export default App;
