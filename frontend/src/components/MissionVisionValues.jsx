import React from "react";
import { FaBullseye, FaEye, FaRegCheckCircle } from "react-icons/fa"; // Using Font Awesome icons
import "../styles/MissionVisionValues.css";

const MissionVisionValues = () => {
  return (
    <div className="mv-section">
      {/* Mission Section */}
      <div className="mv-item">
        <div className="mv-icon">
          <FaBullseye size={50} />
        </div>
        <div className="mv-content">
          <h2 className="mv-title">Our Mission</h2>
          <p className="mv-description">
            To empower individuals with exceptional driving skills and
            technology expertise, fostering confidence and independence on the
            road and beyond.
          </p>
        </div>
      </div>
      <hr className="mv-divider" />

      {/* Vision Section */}
      <div className="mv-item">
        <div className="mv-icon">
          <FaEye size={50} />
        </div>
        <div className="mv-content">
          <h2 className="mv-title">Our Vision</h2>
          <p className="mv-description">
            To be the leading driving school and computing institution, setting
            the standard for excellence and innovation in training and skill
            development.
          </p>
        </div>
      </div>
      <hr className="mv-divider" />

      {/* Values Section */}
      <div className="mv-item">
        <div className="mv-icon">
          <FaRegCheckCircle size={50} />
        </div>
        <div className="mv-content">
          <h2 className="mv-title">Our Values</h2>
          <p className="mv-description">
            We uphold integrity, dedication, and innovation, ensuring every
            student achieves their goals with confidence and skill.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MissionVisionValues;
