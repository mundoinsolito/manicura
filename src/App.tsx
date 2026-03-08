import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DynamicThemeProvider } from "@/components/DynamicThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Booking from "./pages/Booking";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminServices from "./pages/AdminServices";
import AdminAgenda from "./pages/AdminAgenda";
import AdminClients from "./pages/AdminClients";
import AdminFinances from "./pages/AdminFinances";
import AdminPromotions from "./pages/AdminPromotions";
import AdminSettings from "./pages/AdminSettings";
import AdminNotifications from "./pages/AdminNotifications";
import NotFound from "./pages/NotFound";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DynamicThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PWAInstallPrompt />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/servicios" element={<Services />} />
              <Route path="/reservar" element={<Booking />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/servicios" element={<ProtectedRoute><AdminServices /></ProtectedRoute>} />
              <Route path="/admin/agenda" element={<ProtectedRoute><AdminAgenda /></ProtectedRoute>} />
              <Route path="/admin/clientes" element={<ProtectedRoute><AdminClients /></ProtectedRoute>} />
              <Route path="/admin/finanzas" element={<ProtectedRoute><AdminFinances /></ProtectedRoute>} />
              <Route path="/admin/promociones" element={<ProtectedRoute><AdminPromotions /></ProtectedRoute>} />
              <Route path="/admin/configuracion" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/notificaciones" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DynamicThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
