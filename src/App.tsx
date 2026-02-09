import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { DynamicThemeProvider } from "@/components/DynamicThemeProvider";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DynamicThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/servicios" element={<Services />} />
              <Route path="/reservar" element={<Booking />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/servicios" element={<AdminServices />} />
              <Route path="/admin/agenda" element={<AdminAgenda />} />
              <Route path="/admin/clientes" element={<AdminClients />} />
              <Route path="/admin/finanzas" element={<AdminFinances />} />
              <Route path="/admin/promociones" element={<AdminPromotions />} />
              <Route path="/admin/configuracion" element={<AdminSettings />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DynamicThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
