import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DynamicThemeProvider } from "@/components/DynamicThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TenantProvider } from "@/contexts/TenantContext";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

// SaaS pages
import SaasLanding from "./pages/SaasLanding";
import Register from "./pages/Register";
import Login from "./pages/Login";

// Tenant public pages
import Index from "./pages/Index";
import Services from "./pages/Services";
import Booking from "./pages/Booking";

// Tenant admin pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminServices from "./pages/AdminServices";
import AdminAgenda from "./pages/AdminAgenda";
import AdminClients from "./pages/AdminClients";
import AdminFinances from "./pages/AdminFinances";
import AdminPromotions from "./pages/AdminPromotions";
import AdminSettings from "./pages/AdminSettings";
import AdminNotifications from "./pages/AdminNotifications";

// Super admin pages
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminTenants from "./pages/SuperAdminTenants";
import SuperAdminPlans from "./pages/SuperAdminPlans";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function DashboardRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin">
      <TenantProvider source="auth">
        <DynamicThemeProvider>{children}</DynamicThemeProvider>
      </TenantProvider>
    </ProtectedRoute>
  );
}

function TenantRoute({ children }: { children: React.ReactNode }) {
  return (
    <TenantProvider source="slug">
      <DynamicThemeProvider>{children}</DynamicThemeProvider>
    </TenantProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PWAInstallPrompt />
          <Routes>
            {/* SaaS pages */}
            <Route path="/" element={<SaasLanding />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Legacy redirects */}
            <Route path="/admin" element={<Navigate to="/login" replace />} />
            <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />

            {/* Tenant dashboard */}
            <Route path="/dashboard" element={<DashboardRoute><AdminDashboard /></DashboardRoute>} />
            <Route path="/dashboard/servicios" element={<DashboardRoute><AdminServices /></DashboardRoute>} />
            <Route path="/dashboard/agenda" element={<DashboardRoute><AdminAgenda /></DashboardRoute>} />
            <Route path="/dashboard/clientes" element={<DashboardRoute><AdminClients /></DashboardRoute>} />
            <Route path="/dashboard/finanzas" element={<DashboardRoute><AdminFinances /></DashboardRoute>} />
            <Route path="/dashboard/promociones" element={<DashboardRoute><AdminPromotions /></DashboardRoute>} />
            <Route path="/dashboard/configuracion" element={<DashboardRoute><AdminSettings /></DashboardRoute>} />
            <Route path="/dashboard/notificaciones" element={<DashboardRoute><AdminNotifications /></DashboardRoute>} />

            {/* Super admin */}
            <Route path="/superadmin" element={<ProtectedRoute requiredRole="super_admin"><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/tenants" element={<ProtectedRoute requiredRole="super_admin"><SuperAdminTenants /></ProtectedRoute>} />
            <Route path="/superadmin/plans" element={<ProtectedRoute requiredRole="super_admin"><SuperAdminPlans /></ProtectedRoute>} />

            {/* Tenant public pages - MUST be last (catch-all slug) */}
            <Route path="/:slug" element={<TenantRoute><Index /></TenantRoute>} />
            <Route path="/:slug/servicios" element={<TenantRoute><Services /></TenantRoute>} />
            <Route path="/:slug/reservar" element={<TenantRoute><Booking /></TenantRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
