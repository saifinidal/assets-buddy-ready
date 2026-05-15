import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AnnaExch from "./pages/AnnaExch";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Casino from "./pages/Casino";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import GamePlayer from "./pages/GamePlayer";
import BetHistory from "./pages/BetHistory";
import AdminPanel from "./pages/AdminPanel";
import AgentPanel from "./pages/AgentPanel";
import Rules from "./pages/Rules";
import MatchDetail from "./pages/MatchDetail";
import ApiDocs from "./pages/ApiDocs";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import ResponsibleGaming from "./pages/ResponsibleGaming";
import { SpribeBalanceSync } from "./components/SpribeBalanceSync";
import { ThemeApplier } from "./components/ThemeApplier";
import { MaintenanceGate } from "./components/MaintenanceGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SpribeBalanceSync />
          <ThemeApplier />
          <MaintenanceGate>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/account" element={<Dashboard />} />
            <Route path="/wallet" element={<Dashboard />} />
            <Route path="/inplay" element={<AnnaExch />} />
            <Route path="/skyexch" element={<AnnaExch />} />
            <Route path="/annaexch" element={<AnnaExch />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/casino" element={<Casino />} />
            <Route path="/play" element={<GamePlayer />} />
            <Route path="/support" element={<Support />} />
            <Route path="/bet-history" element={<BetHistory />} />
            <Route path="/history" element={<BetHistory />} />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/agent" element={
              <ProtectedRoute requireAgent>
                <AgentPanel />
              </ProtectedRoute>
            } />
            <Route path="/rules" element={<Rules />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/responsible-gaming" element={<ResponsibleGaming />} />
            <Route path="/api-docs" element={
              <ProtectedRoute requireAgent>
                <ApiDocs />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </MaintenanceGate>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
