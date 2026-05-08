import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from './components/navbar';
import Footer from './components/Footer';
const Home = lazy(() => import('./pages/Home'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const OurTeam = lazy(() => import('./pages/OurTeam'));
const Courses = lazy(() => import('./pages/Courses'));
const Enroll = lazy(() => import('./pages/Enroll'));
const ComputingCatalog = lazy(() => import('./pages/ComputingCatalog'));
const DrivingCatalog = lazy(() => import('./pages/DrivingCatalog'));
const AdmissionForm = lazy(() => import('./components/AdmissionForm'));
import WhatsAppIcon from './components/WhatsappIcon';
const FeesStructure = lazy(() => import('./pages/FeesStructure'));
const VerifyReceipt = lazy(() => import('./pages/VerifyReceipt'));
const AdminDashboard = lazy(() => import('./admin/components/AdminDashboard'));
const AdminAdmissionForm = lazy(() => import('./admin/components/AdminAdmissionForm'));
const AdminLayout = lazy(() => import('./admin/components/AdminLayout'));
const Login = lazy(() => import('./admin/Login'));
const Signup = lazy(() => import('./admin/Signup'));
import RequireAuth from './admin/RequireAuth';
import ScrollToTop from './components/ScrollToTop';
const NotFound = lazy(() => import('./pages/NotFound'));
const StudentsList = lazy(() => import('./admin/components/StudentsList'));
const StudentDetail = lazy(() => import('./admin/components/StudentDetail'));
const AdminFees = lazy(() => import('./admin/components/AdminFees'));
const AdminPaymentHistory = lazy(() => import('./admin/components/AdminPaymentHistory'));
const AdminInquiries = lazy(() => import('./admin/components/AdminInquiries'));
const AdminFuel = lazy(() => import('./admin/components/AdminFuel'));
const AdminExpenses = lazy(() => import('./admin/components/AdminExpenses'));
const AdminReports = lazy(() => import('./admin/components/AdminReports'));
const AdminNotifications = lazy(() => import('./admin/components/AdminNotifications'));
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import Seo from './components/Seo';
import { AuthProvider } from './context/AuthContext';

const RouteFallback = () => <div style={{ padding: 24 }}>Loading...</div>;

const MainApp = () => {
  const location = useLocation();
  const hideChrome = ['/admin/login', '/admin/signup'].includes(location.pathname);
  return (
    <>
      <SpeedInsights />
      <Analytics />
      {!hideChrome && <Navbar />}
      {!hideChrome && <WhatsAppIcon />}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/our-team" element={<OurTeam />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/computing" element={<ComputingCatalog />} />
          <Route path="/driving" element={<DrivingCatalog />} />
          <Route path="/fees-structure" element={<FeesStructure />} />
          <Route path="/feesStructure" element={<Navigate to="/fees-structure" replace />} />
          <Route path="/verify-receipt/:studentId/:paymentId" element={<VerifyReceipt />} />
          <Route
            path="/admin/login"
            element={
              <>
                <Seo
                  title="Admin Login"
                  description="Administrator sign-in for Zane Driving School."
                  path="/admin/login"
                  robots="noindex, nofollow"
                />
                <AuthProvider>
                  <Login />
                </AuthProvider>
              </>
            }
          />
          <Route
            path="/admin/signup"
            element={
              <>
                <Seo
                  title="Admin Signup"
                  description="Administrator account creation for Zane Driving School."
                  path="/admin/signup"
                  robots="noindex, nofollow"
                />
                <AuthProvider>
                  <Signup />
                </AuthProvider>
              </>
            }
          />
          <Route path="/navbar" element={<Navbar />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {!hideChrome && <Footer />}
    </>
  );
};

const ProtectedAdminRoute = ({ children }) => (
  <AuthProvider>
    <RequireAuth>
      <AdminLayout>
        {children}
      </AdminLayout>
    </RequireAuth>
  </AuthProvider>
);

ProtectedAdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};

const AdminApp = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/admin/dashboard" element={
        <ProtectedAdminRoute>
          <AdminDashboard />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/register" element={
        <ProtectedAdminRoute>
          <AdminAdmissionForm />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedAdminRoute>
          <StudentsList />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/students/:id" element={
        <ProtectedAdminRoute>
          <StudentDetail />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/fees" element={
        <ProtectedAdminRoute>
          <AdminFees />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/payments" element={
        <ProtectedAdminRoute>
          <AdminPaymentHistory />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/fuel" element={
        <ProtectedAdminRoute>
          <AdminFuel />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/enquiries" element={
        <ProtectedAdminRoute>
          <AdminInquiries />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/expenses" element={
        <ProtectedAdminRoute>
          <AdminExpenses />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedAdminRoute>
          <AdminReports />
        </ProtectedAdminRoute>
      } />
      <Route path="/admin/notifications" element={
        <ProtectedAdminRoute>
          <AdminNotifications />
        </ProtectedAdminRoute>
      } />
    </Routes>
  </Suspense>
);

const AppContent = () => {
  const location = useLocation();
  // Refined admin route check
  const isAdminRoute = location.pathname.startsWith('/admin') &&
    !['/admin/login', '/admin/signup'].includes(location.pathname);

  // Hide navbar offset on auth pages and all admin pages (admin has no public navbar)
  const isAuthPage = ['/admin/login', '/admin/signup'].includes(location.pathname);
  const hideOffset = isAuthPage || isAdminRoute;
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (hideOffset) document.body.classList.add('no-navbar-offset');
    else document.body.classList.remove('no-navbar-offset');
    return () => document.body.classList.remove('no-navbar-offset');
  }, [hideOffset]);

  if (location.pathname === '/admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <>
      <ScrollToTop />
      {isAdminRoute ? <AdminApp /> : <MainApp />}
    </>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
