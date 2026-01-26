import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pacientes" element={<Patients />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/comissoes" element={<Commissions />} />
          <Route path="/estoque" element={<Inventory />} />
          <Route path="/profissionais" element={<Professionals />} />
          <Route path="/ponto" element={<TimeClock />} />
          <Route path="/administracao" element={<Administration />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
