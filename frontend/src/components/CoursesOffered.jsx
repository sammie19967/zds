import React from "react";
import "../styles/CousesOffered.css";

const CoursesOffered = () => {
  return (
    <div className="courses-container">
      <h1 className="section-title">Courses Offered</h1>
      <div className="courses-wrapper">
        <div className="course-section">
          <h2 className="course-title">Driving Courses</h2>
          <ul className="course-list">
            <li><i className="fas fa-car"></i> Beginner</li>
            <li><i className="fas fa-car-crash"></i> Endorsement</li>
            <li><i className="fas fa-tools"></i> Refresher</li>
          </ul>
          <p className="course-note">Get a free computer package when you enroll in Beginner Driving!</p>
        </div>
        <div className="vertical-divider"></div>
        <div className="course-section">
          <h2 className="course-title">Computing Courses</h2>
          <ul className="course-list">
            <li><i className="fas fa-code"></i> Programming</li>
            <li><i className="fas fa-file-word"></i> Microsoft Word</li>
            <li><i className="fas fa-file-excel"></i> Microsoft Excel</li>
            <li><i className="fas fa-file-powerpoint"></i> PowerPoint</li>
            <li><i className="fas fa-network-wired"></i> Networking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoursesOffered;
