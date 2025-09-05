import  { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/FormMessage.css";
import { FaEye, FaDownload, FaArrowDown, FaShieldAlt } from "react-icons/fa";

const FormMessage = () => {
  const [showFees, setShowFees] = useState(false);
  const navigate = useNavigate();

  const handleViewFees = () => {
    setShowFees(!showFees);
  };

  const handleScrollToForm = () => {
    // This would scroll to the form section
    const formSection = document.getElementById("multi-form-container");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="thank-you-container">
      <div className="content">
        <div className="header-section">
          <div className="icon-shield">
            <FaShieldAlt />
          </div>
          <h2>Thank You for Choosing Zane Driving School</h2>
          <p>We value your privacy and guarantee that your data will remain private and secure.</p>
        </div>

        <div className="action-buttons">
          <button className="cta-button primary" onClick={handleScrollToForm}>
            <FaArrowDown />
            Fill in the form below
          </button>
          
          <div className="fees-buttons">
            <button className="fees-btn view-btn" onClick={handleViewFees}>
              <FaEye />
              View Fees Structure
            </button>
            <button className="fees-btn download-btn" onClick={() => navigate('/feesStructure')}>
              <FaDownload />
              Download Fees Structure
            </button>
          </div>
        </div>

        {showFees && (
          <div className="fees-preview">
            <h3>Fees Structure Overview</h3>
            <div className="fees-table">
              <div className="fees-row header">
                <div>Course</div>
                <div>Duration</div>
                <div>Fees (Ksh)</div>
              </div>
              <div className="fees-row">
                <div>New Student </div>
                <div>4 weeks</div>
                <div>15,000</div>
              </div>
              <div className="fees-row">
                <div>Endorsement </div>
                <div>4 weeks</div>
                <div>9,000</div>
              </div>
              <div className="fees-row">
                <div>Refresher Course</div>
                <div>3 weeks</div>
                <div>9,000</div>
              </div>
              <div className="fees-row">
                <div>Computer Packages</div>
                <div>2 months</div>
                <div>3,000</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <svg className="wave-bottom" viewBox="0 0 120 28" preserveAspectRatio="none">
        <path d="M0 0 Q 30 25, 60 5 Q 90 25, 120 0 L 120 28 L 0 28 Z" fill="#ffffff"></path>
      </svg>
    </div>
  );
};

export default FormMessage;