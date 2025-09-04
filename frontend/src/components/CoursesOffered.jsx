import  { useState, useEffect } from "react";
import "../styles/CousesOffered.css";

const CoursesOffered = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="courses-container">
      <h1 className={`section-title ${isVisible ? 'animate-in' : ''}`}>Courses Offered</h1>
      <div className="courses-wrapper">
        <div className={`course-section ${isVisible ? 'animate-in' : ''}`}>
          <div className="course-header">
            <div className="course-icon driving-icon">
              <i className="fas fa-car"></i>
            </div>
            <h2 className="course-title">Driving Courses</h2>
          </div>
          <ul className="course-list">
            <li>
              <span className="list-icon">
                <i className="fas fa-car"></i>
              </span>
              <div className="course-text">
                <span className="course-name">Beginner</span>
                <span className="course-desc">Start your driving journey</span>
              </div>
            </li>
            <li>
              <span className="list-icon">
                <i className="fas fa-car-crash"></i>
              </span>
              <div className="course-text">
                <span className="course-name">Endorsement</span>
                <span className="course-desc">Upgrade your license</span>
              </div>
            </li>
            <li>
              <span className="list-icon">
                <i className="fas fa-tools"></i>
              </span>
              <div className="course-text">
                <span className="course-name">Refresher</span>
                <span className="course-desc">Brush up your skills</span>
              </div>
            </li>
          </ul>
          <div className="promo-banner">
            <div className="promo-content">
              <i className="fas fa-gift"></i>
              <span>Get a free computer package when you enroll in Beginner Driving!</span>
            </div>
          </div>
        </div>
        
        <div className="vertical-divider"></div>
        
        <div className={`course-section ${isVisible ? 'animate-in' : ''}`}>
          <div className="course-header">
            <div className="course-icon computer-icon">
              <i className="fas fa-laptop-code"></i>
            </div>
            <h2 className="course-title">Computing Courses</h2>
          </div>
          <ul className="course-list">
            <li>
              <span className="list-icon">
                <i className="fas fa-code"></i>
              </span>
              <div className="course-text">
                <span className="course-name">Programming</span>
                <span className="course-desc">Learn to code</span>
              </div>
            </li>
            <li>
              <span className="list-icon">
                <i className="fas fa-file-word"></i>
              </span>
              <div className="course-text">
                <span className="course-name">Microsoft Word</span>
                <span className="course-desc">Document processing</span>
              </div>
            </li>
            <li>
              <span className="list-icon">
                <i className="fas fa-file-excel"></i>
              </span>
              <div className="course-text">
                <span className="course-name">Microsoft Excel</span>
                <span className="course-desc">Spreadsheets & data</span>
              </div>
            </li>
            <li>
              <span className="list-icon">
                <i className="fas fa-file-powerpoint"></i>
              </span>
              <div className="course-text">
                <span className="course-name">PowerPoint</span>
                <span className="course-desc">Presentations</span>
              </div>
            </li>
            <li>
              <span className="list-icon">
                <i className="fas fa-network-wired"></i>
              </span>
              <div className="course-text">
                <span className="course-name">Networking</span>
                <span className="course-desc">IT infrastructure</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoursesOffered;