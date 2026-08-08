import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getMe } from './redux/slices/authSlice';
import AppLayout from './components/layout/AppLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { connectSocket, disconnectSocket } from './services/socketService';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const OwnerDashboard = lazy(() => import('./pages/dashboard/OwnerDashboard'));
const ManagerDashboard = lazy(() => import('./pages/dashboard/ManagerDashboard'));
const EngineerDashboard = lazy(() => import('./pages/dashboard/EngineerDashboard'));
const WorkerDashboard = lazy(() => import('./pages/dashboard/WorkerDashboard'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'));
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'));
const GanttPage = lazy(() => import('./pages/gantt/GanttPage'));
const ResourcesPage = lazy(() => import('./pages/resources/ResourcesPage'));
const WorkersPage = lazy(() => import('./pages/workers/WorkersPage'));
const ExpensesPage = lazy(() => import('./pages/expenses/ExpensesPage'));
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const CalendarPage = lazy(() => import('./pages/calendar/CalendarPage'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const QRPublicPage = lazy(() => import('./pages/qr/QRPublicPage'));
const FinancePage = lazy(() => import('./pages/finance/FinancePage'));
const SuppliersPage = lazy(() => import('./pages/suppliers/SuppliersPage'));
const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const BIMProjectsPage = lazy(() => import('./pages/bim/BIMProjectsPage'));
const DesignStudioPage = lazy(() => import('./pages/bim/DesignStudioPage'));
const MaterialLibraryPage = lazy(() => import('./pages/bim/MaterialLibraryPage'));
const CostEstimationPage = lazy(() => import('./pages/bim/CostEstimationPage'));
const BIMAnalyticsPage = lazy(() => import('./pages/bim/BIMAnalyticsPage'));
const StructuralDesignPage = lazy(() => import('./pages/bim/StructuralDesignPage'));
const MEPDashboardPage = lazy(() => import('./pages/bim/MEPDashboardPage'));
const ImportExportPage = lazy(() => import('./pages/bim/ImportExportPage'));
const DesignApprovalsPage = lazy(() => import('./pages/bim/DesignApprovalsPage'));
const ClientReviewPage = lazy(() => import('./pages/bim/ClientReviewPage'));
const AIArchitectPage = lazy(() => import('./pages/bim/AIArchitectPage'));
const VirtualTourPage = lazy(() => import('./pages/bim/VirtualTourPage'));
const CollaborationPage = lazy(() => import('./pages/bim/CollaborationPage'));
const ExportManagerPage = lazy(() => import('./pages/bim/ExportManagerPage'));
const VRARViewerPage = lazy(() => import('./pages/bim/VRARViewerPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function DashboardRouter() {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <LoadingSpinner />;
  switch (user.role) {
    case 'admin': return <OwnerDashboard />;
    case 'project_manager': return <ManagerDashboard />;
    case 'engineer':
    case 'supervisor': return <EngineerDashboard />;
    case 'worker': return <WorkerDashboard />;
    default: return <OwnerDashboard />;
  }
}

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(getMe());
      connectSocket(token);
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [dispatch, token]);

  return (
    <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/qr/:id" element={<QRPublicPage />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<DashboardRouter />} />
          <Route path="dashboard" element={<DashboardRouter />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="gantt" element={<GanttPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="bim" element={<BIMProjectsPage />} />
          <Route path="bim/studio/:id" element={<DesignStudioPage />} />
          <Route path="bim/materials" element={<MaterialLibraryPage />} />
          <Route path="bim/cost-estimation" element={<CostEstimationPage />} />
          <Route path="bim/analytics" element={<BIMAnalyticsPage />} />
          <Route path="bim/structural" element={<StructuralDesignPage />} />
          <Route path="bim/mep" element={<MEPDashboardPage />} />
          <Route path="bim/import" element={<ImportExportPage />} />
          <Route path="bim/approvals" element={<DesignApprovalsPage />} />
          <Route path="bim/review" element={<ClientReviewPage />} />
          <Route path="bim/review/:projectId" element={<ClientReviewPage />} />
          <Route path="bim/ai-architect" element={<AIArchitectPage />} />
          <Route path="bim/virtual-tour" element={<VirtualTourPage />} />
          <Route path="bim/tour/:token" element={<VirtualTourPage />} />
          <Route path="bim/collaboration" element={<CollaborationPage />} />
          <Route path="bim/exports" element={<ExportManagerPage />} />
          <Route path="bim/vr-ar" element={<VRARViewerPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
    </ErrorBoundary>
  );
}
