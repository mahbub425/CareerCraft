import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import VerifyEmail from './pages/public/VerifyEmail';
import CVBuilder from './pages/user/CVBuilder';
import CVPreviewPage from './pages/user/CVPreviewPage';
import UserDashboard from './pages/user/UserDashboard';
import UserProfile from './pages/user/UserProfile';
import UserTemplates from './pages/user/UserTemplates';
import AdminAboutDeveloper from './pages/admin/AdminAboutDeveloper';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCVActivity from './pages/admin/AdminCVActivity';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSiteContent from './pages/admin/AdminSiteContent';
import AdminTemplateForm from './pages/admin/AdminTemplateForm';
import AdminTemplates from './pages/admin/AdminTemplates';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPackages from './pages/admin/AdminPackages';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSubscribers from './pages/admin/AdminSubscribers';
import Upgrade from './pages/user/Upgrade';
import UserPlans from './pages/user/UserPlans';
import BillingPage from './pages/user/BillingPage';
import BillingHistory from './pages/user/BillingHistory';
import { authService } from './services/authService';
import Toast from './components/ui/Toast';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    authService.getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setIsAuthenticated(Boolean(user?.emailVerification));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-blue-50">
        <div className="rounded-3xl border border-blue-100 bg-white px-6 py-5 text-sm font-bold text-blue-700 shadow-xl shadow-blue-900/10">
          Checking your session...
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    authService.getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setIsAuthenticated(Boolean(user?.emailVerification));
          setIsAdmin(Boolean(user?.emailVerification) && authService.isAdminUser(user));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-700 shadow-xl shadow-slate-900/10">
          Checking admin permission...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin ? children : <Navigate to="/user/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toast />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/templates" element={<div>Templates Listing</div>} />
          <Route path="/templates/:id" element={<div>Template Preview</div>} />
          
          {/* User Routes */}
          <Route 
            path="/user/dashboard" 
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/user/templates" element={<ProtectedRoute><UserTemplates /></ProtectedRoute>} />
          <Route path="/user/cv/create" element={<ProtectedRoute><CVBuilder /></ProtectedRoute>} />
          <Route path="/user/cv/:id/edit" element={<ProtectedRoute><CVBuilder /></ProtectedRoute>} />
          <Route path="/user/cv/:id/preview" element={<ProtectedRoute><CVPreviewPage /></ProtectedRoute>} />
          <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/user/plans" element={<ProtectedRoute><UserPlans /></ProtectedRoute>} />
          <Route path="/user/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
          <Route path="/user/billing-history" element={<ProtectedRoute><BillingHistory /></ProtectedRoute>} />
          <Route path="/user/upgrade" element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/templates" element={<Navigate to="/admin/template-gallery" replace />} />
          <Route path="/admin/templates/create" element={<Navigate to="/admin/template-builder" replace />} />
          <Route path="/admin/templates/:id/edit" element={<AdminRoute><AdminTemplateForm /></AdminRoute>} />
          <Route path="/admin/template-builder" element={<AdminRoute><AdminTemplateForm /></AdminRoute>} />
          <Route path="/admin/template-gallery" element={<AdminRoute><AdminTemplates /></AdminRoute>} />
          <Route path="/admin/template-gallery/:id/edit" element={<AdminRoute><AdminTemplateForm /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/cv-activity" element={<AdminRoute><AdminCVActivity /></AdminRoute>} />
          <Route path="/admin/site-content" element={<AdminRoute><AdminSiteContent /></AdminRoute>} />
          <Route path="/admin/packages" element={<AdminRoute><AdminPackages /></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
          <Route path="/admin/subscribers" element={<AdminRoute><AdminSubscribers /></AdminRoute>} />
          <Route path="/admin/about-developer" element={<AdminRoute><AdminAboutDeveloper /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
