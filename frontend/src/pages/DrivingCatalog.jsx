import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DrivingCatalog.css";

import proboxImage from "../assets/vehicles/probox.jpg";
import vitzImage from "../assets/vehicles/vitz.jpg";
import motorbikeImage from "../assets/vehicles/motorbike.jpg";
import lorryImage from "../assets/vehicles/lorry.png";
import vanImage from "../assets/vehicles/van.jpg";
import busImage from "../assets/vehicles/bus.png";

const vehicles = [
  { id: 1, name: "Probox", class: "B light", cost: "Ksh.15,000", image: proboxImage, requirement: "ID", bgColor: "#f7c6c7" },
  { id: 2, name: "Vitz", class: "B2 Automatic", cost: "Ksh.15,000", image: vitzImage, requirement: "ID", bgColor: "#ffd59e" },
  { id: 3, name: "Motorbike", class: "A1 A2", cost: "Ksh.7,000", image: motorbikeImage, requirement: "ID", bgColor: "#d4f0f0" },
  { id: 4, name: "Light Truck", class: "Class C1", cost: "Ksh.9,000", image: lorryImage, requirement: "ID and DL", bgColor: "#c8e6c9" },
  { id: 5, name: "PSV", class: "D1", cost: "Ksh.9,000", image: vanImage, requirement: "ID and DL", bgColor: "#ffecb3" },
  { id: 6, name: "Bus", class: "D2", cost: "Coming Soon", image: busImage, requirement: "ID and DL", bgColor: "#c5cae9" },
];

const Catalogue = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    alert("Welcome to Zane Driving School! Fill the Application form to proceed");
    navigate("/ApplicationForm");
  };

  return (
    <div className="catalogue-container">
      <div className="catalog-title"><h1>Driving Courses</h1></div>
      <div className="catalog-description">Explore what we offer for New drivers, Endorsers and Refreshers </div>
      
      <div className="catalogue-grid">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="catalogue-item" style={{ backgroundColor: vehicle.bgColor }}>
            <img src={vehicle.image} alt={vehicle.name} className="vehicle-image" />
            <div className="catalogue-info">
              <h3>{vehicle.name}</h3>
              <span className="class">Class: {vehicle.class}</span>
              <span className="cost">Cost: {vehicle.cost}</span>
              <span className="requirement">Requirement: {vehicle.requirement}</span>
              <button onClick={handleClick}>Apply Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalogue;
