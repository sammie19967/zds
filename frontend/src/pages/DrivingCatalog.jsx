import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import modal from "../utils/modal";
import ScrollToTop from "../components/ScrollToTop";
import Seo from "../components/Seo";

import "../styles/DrivingCatalog.css";

import proboxImage from "../assets/vehicles/probox front.jpg";
import vitzImage from "../assets/vehicles/vitz.jpg";
import motorbikeImage from "../assets/vehicles/motorbike.jpg";
import lorryImage from "../assets/vehicles/lorry.png";
import vanImage from "../assets/vehicles/van.jpg";
import busImage from "../assets/vehicles/bus.png";

const vehicles = [
  { id: 1, name: "Probox", class: "Class B light Manual", cost: "Ksh.15,000", image: proboxImage, requirement: "ID", bgColor: "#f7c6c7" },
  { id: 2, name: "Vitz", class: "Class B2 Automatic", cost: "Ksh.15,000", image: vitzImage, requirement: "ID", bgColor: "#ffd59e" },
  { id: 3, name: "Motorbike", class: "Class A1 A2", cost: "Ksh.7,000", image: motorbikeImage, requirement: "ID", bgColor: "#d4f0f0" },
  { id: 4, name: "Light Truck", class: "Class C1", cost: "Ksh.9,000", image: lorryImage, requirement: "ID and DL", bgColor: "#c8e6c9" },
  { id: 5, name: "PSV", class: "Class D1", cost: "Ksh.9,000", image: vanImage, requirement: "ID and DL", bgColor: "#ffecb3" },
  { id: 6, name: "Bus", class: "Class D2", cost: "Coming Soon", image: busImage, requirement: "ID and DL", bgColor: "#c5cae9" },
];

const Catalogue = ({ enableSeo = true }) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      await modal.info({
        title: "Welcome to Zane Driving School!",
        text: "Fill the Application form to proceed.",
      });
      // Scroll to top before navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Small delay to ensure scroll completes before navigation
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate("/enroll");
    } catch (error) {
      console.error("Error during navigation:", error);
    }
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {enableSeo && (
        <Seo
          title="Driving Courses"
          description="View driving course options at Zane Driving School, including motorbike, saloon car, PSV, and truck training with current fee guidance."
          path="/driving"
        />
      )}
      <ScrollToTop />
      <div className="catalogue-container">
      <div className="catalog-header">
        <div className="header-content">
          <h1 className="catalog-title">Driving Courses</h1>
          <p className="catalog-description">
            Explore what we offer for New drivers, Endorsers and Refreshers
          </p>
          <div className="header-divider"></div>
        </div>
      </div>
      
      <div className="catalogue-grid">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="catalogue-card">
            <div className="card-inner">
              <div className="card-front">
                <div className="vehicle-image-container">
                  <img src={vehicle.image} alt={vehicle.name} className="vehicle-image" />
                  <div className="image-overlay"></div>
                  <div className="vehicle-class-badge">{vehicle.class}</div>
                </div>
                <div className="card-content">
                  <h3 className="vehicle-name">{vehicle.name}</h3>
                  <div className="vehicle-details">
                    <div className="detail-row">
                      <span className="detail-label">Course Fee:</span>
                      <span className="detail-value cost">{vehicle.cost}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Requirements:</span>
                      <span className="detail-value requirement">{vehicle.requirement}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-back">
                <div className="back-content">
                  <h3>Ready to Drive?</h3>
                  <p>Join our professional {vehicle.class} driving course</p>
                  <button className="apply-now-btn" onClick={handleClick}>
                    Apply Now
                    <span className="btn-arrow">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="catalog-footer">
        <p>Not sure which vehicle is right for you? <Link to="/contact-us" className="contact-link">Contact us for guidance</Link></p>
      </div>
    </div>
    </>
  );
};

Catalogue.propTypes = {
  enableSeo: PropTypes.bool
};

export default Catalogue;
