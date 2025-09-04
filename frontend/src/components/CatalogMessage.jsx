import React, { useState } from "react";
import "../styles/CatalogMessage.css";
import { FaCar, FaLaptopCode, FaChevronRight } from "react-icons/fa";

const CatalogMessage = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  const handleCategorySelect = (category) => {
    setActiveCategory(category);
    // Scroll to the selected category section
    const section = document.getElementById(`${category}-courses`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="catalog-container">
      <div className="content">
        <div className="catalog-header">
          <div className="icon-container">
            <div className="icon-circle">
              <FaCar className="icon driving-icon" />
              <FaLaptopCode className="icon computing-icon" />
            </div>
          </div>
          <h2>Welcome to Zane Driving School's Course Catalog</h2>
          <p>
            Discover our comprehensive range of courses designed to enhance your skills. 
            Select a category below to explore our offerings in detail.
          </p>
        </div>

        <div className="category-selection">
          <div className="category-card driving-card">
            <div className="category-icon">
              <FaCar />
            </div>
            <h3>Driving Courses</h3>
            <p>Professional driving lessons for all license categories</p>
            <button 
              className={`category-button driving-btn ${activeCategory === 'driving' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('driving')}
            >
              Explore Driving Courses
              <FaChevronRight className="button-arrow" />
            </button>
          </div>

          <div className="category-card computing-card">
            <div className="category-icon">
              <FaLaptopCode />
            </div>
            <h3>Computing Courses</h3>
            <p>Essential computer skills for the digital world</p>
            <button 
              className={`category-button computing-btn ${activeCategory === 'computing' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('computing')}
            >
              Explore Computing Courses
              <FaChevronRight className="button-arrow" />
            </button>
          </div>
        </div>
      </div>

      <div className="diagonal-divider"></div>
    </div>
  );
};

export default CatalogMessage;