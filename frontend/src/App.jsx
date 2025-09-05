import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import OurTeam from './pages/OurTeam';
import Courses from './pages/Courses';
import NotFound from './pages/NotFound';
import Navbar from './components/navbar';
import Enroll from './pages/Enroll';
import Footer from './components/Footer';
import ComputingCatalog from './pages/ComputingCatalog';
import DrivingCatalog from './pages/DrivingCatalog';
import AdmissionForm from './components/AdmissionForm';
import WhatsAppIcon from './components/WhatsappIcon';
import FeesStructure from './pages/FeesStructure';


const App = () => {
  return (
    <Router>

      <Navbar/>
      <WhatsAppIcon/>
      <Routes>
        {/* Main routes */}
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
        
        {/* Catch-all route for undefined paths */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
