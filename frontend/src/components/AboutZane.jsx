import React from "react";
import "../styles/AboutZane.css";
import carImage1 from "../assets/car1.png";
import carImage2 from "../assets/car2.png";
import carImage3 from "../assets/car3.png";
import logoImage from "../assets/logo.png";

const AboutZane = () => {
  return (
    <div className="about-zane-container">
      {/* Background Cars */}
      <div className="background-cars">
        <img src={carImage1} alt="Car 1" className="car1" />
        <img src={carImage2} alt="Car 2" className="car2" />
        <img src={carImage3} alt="Car 3" className="car3" />
      </div>

      {/* Content Section */}
      <div className="about-zane-content">
        <div className="about-zane-text">
          <h1 className="about-zane-title">About Zane Driving School</h1>
          <p className="about-zane-description">
            Zane Driving School was founded in 2022 with the purpose of equipping the
            society with the best skills in driving and computer literacy to help the
            community catch up with the emerging needs for computing and automotive
            technology. From top-level integrity, qualified instructors, certified
            courses, and affordable rates—look no further. Join us today!
          </p>
        </div>
        <div className="about-zane-image">
          <img src={logoImage} alt="About Zane" />
        </div>
      </div>
    </div>
  );
};

export default AboutZane;
