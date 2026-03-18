import { Link } from "react-router-dom";
import "../styles/CatalogMessage.css";
import { FaCar, FaLaptopCode, FaChevronRight } from "react-icons/fa";

const CatalogMessage = () => {
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
          <h2>Welcome to Zane Driving School&apos;s Course Catalog</h2>
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
            <Link className="category-button driving-btn" to="/driving">
              Explore Driving Courses
              <FaChevronRight className="button-arrow" />
            </Link>
          </div>

          <div className="category-card computing-card">
            <div className="category-icon">
              <FaLaptopCode />
            </div>
            <h3>Computing Courses</h3>
            <p>Essential computer skills for the digital world</p>
            <Link className="category-button computing-btn" to="/computing">
              Explore Computing Courses
              <FaChevronRight className="button-arrow" />
            </Link>
          </div>
        </div>
      </div>

      <div className="diagonal-divider"></div>
    </div>
  );
};

export default CatalogMessage;
