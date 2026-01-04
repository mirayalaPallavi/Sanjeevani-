import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GroqAssistant } from "@/components/GroqAssistant";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SymptomChecker from "./pages/SymptomChecker";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import MedicalReports from "./pages/MedicalReports";
import Consultation from "./pages/Consultation";
import NearbyServices from "./pages/NearbyServices";
import CallHistory from "./pages/CallHistory";
import NotFound from "./pages/NotFound";
import RoleSelection from "./pages/auth/RoleSelection";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorConsultations from "./pages/doctor/DoctorConsultations";
import ConsultationChat from "./pages/ConsultationChat";
import VisualDiagnosis from "./pages/VisualDiagnosis";
import { RoleProtectedRoute } from "./components/auth/RoleProtectedRoute";

const queryClient = new QueryClient();

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />

      {/* Protected Routes */}
      <Route
        path="/role-selection"
        element={
          <RoleProtectedRoute>
            <RoleSelection />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RoleProtectedRoute>
            <Dashboard />
          </RoleProtectedRoute>
        }
      />

      {/* Patient Routes */}
      <Route
        path="/symptom-checker"
        element={
          <RoleProtectedRoute allowedRoles={['patient']}>
            <SymptomChecker />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/doctors"
        element={
          <RoleProtectedRoute allowedRoles={['patient']}>
            <Doctors />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <RoleProtectedRoute allowedRoles={['patient']}>
            <Appointments />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <RoleProtectedRoute allowedRoles={['patient']}>
            <MedicalReports />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/nearby"
        element={
          <RoleProtectedRoute allowedRoles={['patient']}>
            <NearbyServices />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <RoleProtectedRoute allowedRoles={['patient']}>
            <CallHistory />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/visual-diagnosis"
        element={
          <RoleProtectedRoute allowedRoles={['patient']}>
            <VisualDiagnosis />
          </RoleProtectedRoute>
        }
      />

      {/* Shared/Role-based Routes */}
      <Route
        path="/appointments"
        element={
          <RoleProtectedRoute>
            <Appointments />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/consultations"
        element={
          <RoleProtectedRoute allowedRoles={['doctor']}>
            <DoctorConsultations />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/patients"
        element={
          <RoleProtectedRoute allowedRoles={['doctor']}>
            <DoctorPatients />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/consultation-chat/:id"
        element={
          <RoleProtectedRoute>
            <ConsultationChat />
          </RoleProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
          <GroqAssistant />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
