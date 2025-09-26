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

const MainApp = () => (
  <>
    <Navbar />
    <WhatsAppIcon />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/contact-us" element={<ContactUs />} />
      <Route path="/our-team" element={<OurTeam />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/enroll" element={<Enroll />} />
      <Route path="/computing" element={<ComputingCatalog />} />
      <Route path="/driving" element={<DrivingCatalog />} />
      <Route path="/admission-form" element={<AdmissionForm />} />
      <Route path="/feesStructure" element={<FeesStructure />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/signup" element={<Signup />} />
      <Route path="/admin/enquiries" element={<AdminInquiries />} />
      <Route path="/admin/fuel" element={<AdminFuel />} />

      <Route path="/navbar" element={<Navbar />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Footer />
  </>
);

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
    {/* Optional: Catch-all for unmatched admin routes */}
    {/* <Route path="/admin/*" element={<NotFound />} /> */}
  </Routes>
);

const AppContent = () => {
  const location = useLocation();
  console.log('Current path:', location.pathname);

  // Refined admin route check
  const isAdminRoute = location.pathname.startsWith('/admin') &&
    !['/admin/login', '/admin/signup'].includes(location.pathname);

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
