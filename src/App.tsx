import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SubscriptionProvider, useSubscription } from "@/hooks/useSubscription";
import { TrialExpiredScreen } from "@/components/subscription/TrialExpiredScreen";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Patients from "./pages/Patients";
import Agenda from "./pages/Agenda";
import Financial from "./pages/Financial";
import Terms from "./pages/Terms";
import Reports from "./pages/Reports";
import Commissions from "./pages/Commissions";
import Inventory from "./pages/Inventory";
import Professionals from "./pages/Professionals";
import TimeClock from "./pages/TimeClock";
import Administration from "./pages/Administration";
import SuperAdmin from "./pages/SuperAdmin";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { isBlocked, isLoading } = useSubscription();
  const { isSuperAdmin } = useAuth();

  // SuperAdmin nunca é bloqueado
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isBlocked) {
    return <TrialExpiredScreen />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Index />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pacientes"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Patients />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agenda"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Agenda />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Financial />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/termos"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Terms />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Reports />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/comissoes"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Commissions />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/estoque"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Inventory />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profissionais"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Professionals />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ponto"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <TimeClock />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/administracao"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Administration />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute>
            <SuperAdmin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <SubscriptionGate>
              <Settings />
            </SubscriptionGate>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <AppRoutes />
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
