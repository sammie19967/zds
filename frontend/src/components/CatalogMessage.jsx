import React from "react";
import "../styles/FormMessage.css"; // Import CSS file

const CatalogMessage = () => {
  return (
    <div className="catalog-container">
      <div className="content">
        <h2>Welcome to Zane Driving School's Course Catalog</h2>
        <p>
          We offer a range of courses to help you enhance your skills. Choose
          the category below to view more details.
        </p>
        <div className="category-buttons">
          <button className="cta-button driving">Driving Courses</button>
          <button className="cta-button computing">Computing Courses</button>
        </div>
      </div>

      <svg className="wave-bottom" viewBox="0 0 120 28" preserveAspectRatio="none">
        <path d="M0 0 Q 30 25, 60 5 Q 90 25, 120 0 L 120 28 L 0 28 Z" fill="#ffffff"></path>
      </svg>
    </div>
  );
};

export default CatalogMessage;
