import React from "react";
import "../styles/ComputingCatalog.css"; // Import CSS file
import image from "../assets/industry.jpg"; // Import the image
import image2 from "../assets/david.jpeg"; // Import the image
import image3 from "../assets/endorsement.jpeg"; // Import the image
import image4 from "../assets/mission.jpeg"; // Import the image
import image5 from "../assets/refresher.jpeg"; // Import the image
import image6 from "../assets/cynthia.jpg"; // Import the image
import image7 from "../assets/car3.png"; // Import the image

const courses = [
  {
    title: "Introduction to Computers",
    image: image7, // Directly reference the imported image
    price: "5,000 Ksh",
    duration: "4 Weeks",
  },
  {
    title: "MS Word & Excel",
    image: image5, // Directly reference the imported image
    price: "7,000 Ksh",
    duration: "6 Weeks",
  },
  {
    title: "Advanced Excel & Data Analysis",
    image: image3, // Directly reference the imported image
    price: "10,000 Ksh",
    duration: "8 Weeks",
  },
  {
    title: "Web Development Basics",
    image: image2, // Directly reference the imported image
    price: "15,000 Ksh",
    duration: "10 Weeks",
  },
];

const ComputingCatalog = () => {
  return (
    <div className="computing-catalog">
      <h2 className="catalog-title">💻 Computing Courses Catalog</h2>
      <p className="catalog-description">
        Explore our computing courses and <strong>boost your digital skills</strong>!
      </p>

      <div className="course-grid">
        {courses.map((course, index) => (
          <div key={index} className="course-card">
            <img src={course.image} alt={course.title} className="course-image" />
            <div className="course-info">
              <h3>{course.title}</h3>
              <p className="price">💰 {course.price}</p>
              <p className="duration">⏳ {course.duration}</p>
              <button className="apply-button">Apply Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComputingCatalog;