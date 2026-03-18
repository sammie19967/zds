import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Navbar from './components/navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import OurTeam from './pages/OurTeam';
import Courses from './pages/Courses';
import Enroll from './pages/Enroll';
import ComputingCatalog from './pages/ComputingCatalog';
import DrivingCatalog from './pages/DrivingCatalog';
import AdmissionForm from './components/AdmissionForm';
import WhatsAppIcon from './components/WhatsappIcon';
import FeesStructure from './pages/FeesStructure';
import VerifyReceipt from './pages/VerifyReceipt';
import AdminDashboard from './admin/components/AdminDashboard';
import AdminAdmissionForm from './admin/components/AdminAdmissionForm';
import AdminLayout from './admin/components/AdminLayout';
import Login from './admin/Login';
import Signup from './admin/Signup';
import RequireAuth from './admin/RequireAuth';
import ScrollToTop from './components/ScrollToTop';
import NotFound from './pages/NotFound';
import StudentsList from './admin/components/StudentsList';
import StudentDetail from './admin/components/StudentDetail';
import AdminFees from './admin/components/AdminFees';
import AdminPaymentHistory from './admin/components/AdminPaymentHistory';
import AdminInquiries from './admin/components/AdminInquiries';
import AdminFuel from './admin/components/AdminFuel';
import AdminExpenses from './admin/components/AdminExpenses';
import AdminReports from './admin/components/AdminReports';
import AdminNotifications from './admin/components/AdminNotifications';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import Seo from './components/Seo';

const MainApp = () => {
  const location = useLocation();
  const hideChrome = ['/admin/login', '/admin/signup'].includes(location.pathname);
  return (
    <>
      <SpeedInsights />
      <Analytics />
      {!hideChrome && <Navbar />}
      {!hideChrome && <WhatsAppIcon />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/our-team" element={<OurTeam />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/enroll" element={<Enroll />} />
        <Route path="/computing" element={<ComputingCatalog />} />
        <Route path="/driving" element={<DrivingCatalog />} />
        <Route
          path="/admission-form"
          element={
            <>
              <Seo
                title="Admission Form"
                description="Complete the Zane Driving School admission form to register for driving or computer training."
                path="/admission-form"
              />
              <AdmissionForm />
            </>
          }
        />
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
              <Login />
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
              <Signup />
            </>
          }
        />
        <Route path="/navbar" element={<Navbar />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideChrome && <Footer />}
    </>
  );
};

const ProtectedAdminRoute = ({ children }) => (
  <RequireAuth>
    <AdminLayout>
      {children}
    </AdminLayout>
  </RequireAuth>
);

ProtectedAdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};

const AdminApp = () => (
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
    {/* Optional: Catch-all for unmatched admin routes */}
    {/* <Route path="/admin/*" element={<NotFound />} /> */}
  </Routes>
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
