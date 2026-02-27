import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { AppLayout } from './components/layout/AppLayout';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { PendingApprovalPage } from './pages/auth/PendingApprovalPage';
import { MasterAdminPage } from './pages/master-admin/MasterAdminPage';
import { HomePage } from './pages/home/HomePage';
import { ProjectLayout } from './pages/projects/ProjectLayout';
import { ProjectHomePage } from './pages/projects/tools/ProjectHomePage';
import { ReportingPage } from './pages/projects/tools/ReportingPage';
import { DocumentsPage } from './pages/projects/tools/DocumentsPage';
import { DirectoryPage } from './pages/projects/tools/DirectoryPage';
import { TasksPage } from './pages/projects/tools/TasksPage';
import { AdminPage } from './pages/projects/tools/AdminPage';
import { RFIsPage } from './pages/projects/tools/RFIsPage';
import { SubmittalsPage } from './pages/projects/tools/SubmittalsPage';
import { StubPage } from './pages/projects/tools/StubPage';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-muted-foreground text-sm">Loading...</div>
  </div>
);

// Fully authenticated + approved users only
function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/sign-in" replace />;
  // Wait for profile to load before deciding
  if (user && !profile) return <LoadingScreen />;
  if (!profile.is_master_admin && profile.status !== 'approved') {
    return <Navigate to="/pending-approval" replace />;
  }
  return children;
}

// Master admin only
function MasterAdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (user && !profile) return <LoadingScreen />;
  if (!profile.is_master_admin) return <Navigate to="/home" replace />;
  return children;
}

// Authenticated but not approved — show pending page; approved goes to /home
function PendingRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (user && !profile) return <LoadingScreen />;
  if (profile.is_master_admin || profile.status === 'approved') {
    return <Navigate to="/home" replace />;
  }
  return children;
}

// Already signed-in users skip auth pages
function AuthRedirect({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return children;
  if (!profile) return null;
  if (profile.is_master_admin || profile.status === 'approved') {
    return <Navigate to="/home" replace />;
  }
  return <Navigate to="/pending-approval" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<AuthRedirect><SignInPage /></AuthRedirect>} />
      <Route path="/sign-up" element={<AuthRedirect><SignUpPage /></AuthRedirect>} />
      <Route path="/pending-approval" element={<PendingRoute><PendingApprovalPage /></PendingRoute>} />
      <Route path="/master-admin" element={
        <MasterAdminRoute>
          <AppLayout><MasterAdminPage /></AppLayout>
        </MasterAdminRoute>
      } />
      <Route path="/home" element={
        <ProtectedRoute>
          <AppLayout><HomePage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/projects/:projectId" element={
        <ProtectedRoute>
          <AppLayout><ProjectLayout /></AppLayout>
        </ProtectedRoute>
      }>
        <Route index element={<ProjectHomePage />} />
        <Route path="home" element={<ProjectHomePage />} />
        <Route path="reporting" element={<ReportingPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="directory" element={<DirectoryPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="rfis" element={<RFIsPage />} />
        <Route path="submittals" element={<SubmittalsPage />} />
        <Route path="transmittals" element={<StubPage title="Transmittals" />} />
        <Route path="punch-list" element={<StubPage title="Punch List" />} />
        <Route path="meetings" element={<StubPage title="Meetings" />} />
        <Route path="schedule" element={<StubPage title="Schedule" />} />
        <Route path="daily-log" element={<StubPage title="Daily Log" />} />
        <Route path="photos" element={<StubPage title="Photos" />} />
        <Route path="drawings" element={<StubPage title="Drawings" />} />
        <Route path="specifications" element={<StubPage title="Specifications" />} />
        <Route path="prime-contracts" element={<StubPage title="Prime Contracts" />} />
        <Route path="budget" element={<StubPage title="Budget" />} />
        <Route path="commitments" element={<StubPage title="Commitments" />} />
        <Route path="change-orders" element={<StubPage title="Change Orders" />} />
        <Route path="change-events" element={<StubPage title="Change Events" />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
