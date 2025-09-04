import React, { useState, useEffect } from "react";
import "../styles/Cards.css"; // Import CSS
import { FaBook, FaUniversity, FaGraduationCap } from "react-icons/fa"; // Icons

const AdmissionCards = () => {
  // Initial states
  const [courses, setCourses] = useState(0);
  const [campuses, setCampuses] = useState(0);
  const [graduates, setGraduates] = useState(0);

  // Simulate count-up effect
  useEffect(() => {
    const increment = (setter, target) => {
      let count = 0;
      const speed = 70; // Speed of count-up
      const incrementValue = Math.ceil(target / 50); // Steps

      const counter = setInterval(() => {
        count += incrementValue;
        if (count >= target) {
          count = target;
          clearInterval(counter);
        }
        setter(count);
      }, speed);
    };

    increment(setCourses, 15); // Total Courses
    increment(setCampuses, 5); // Number of Campuses
    increment(setGraduates, 2000); // Graduated Students
  }, []);

  return (
    <div className="cards-container">
      {/* Courses Offered */}
      <div className="card">
        <FaBook className="card-icon" />
        <div className="card-number">{courses}+</div>
        <div className="card-title">Courses Offered</div>
      </div>

      {/* Campuses */}
      <div className="card">
        <FaUniversity className="card-icon" />
        <div className="card-number">{campuses}+</div>
        <div className="card-title">Campuses</div>
      </div>

      {/* Graduated Students */}
      <div className="card">
        <FaGraduationCap className="card-icon" />
        <div className="card-number">{graduates}+</div>
        <div className="card-title">Graduated Students</div>
      </div>
    </div>
  );
};

export default AdmissionCards;
