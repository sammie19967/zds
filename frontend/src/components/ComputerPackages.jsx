import React from "react";
import "../styles/ComputerPackages.css"; // Import CSS file
import computerImage from "../assets/computer.png"; // Replace with actual image path

const ComputerPackages = () => {
  return (
    <div className="computer-container">
      <div className="computer-image">
        <img src={computerImage} alt="Computer Packages" />
      </div>
      <div className="computer-content">
        <h2>💻 Master Essential Computer Skills!</h2>
        <p>
          Enroll in our **Comprehensive Computer Packages** and gain hands-on experience 
          with the most in-demand digital skills. This course is perfect for beginners and 
          professionals alike!
        </p>

        <ul className="computer-list">
          <li>🖥️ Introduction to Computers</li>
          <li>📑 Microsoft Office Suite (Word, Excel, PowerPoint)</li>
          <li>🌐 Internet & Email Essentials</li>
          <li>💾 Data Management & File Organization</li>
          <li>🎨 Graphic Design Basics (Canva & Photoshop)</li>
          <li>📊 Basic Data Analysis with Excel</li>
        </ul>

        <div className="computer-price">💰 Only Ksh 15,000</div>
        
        <div className="computer-buttons">
          <button className="apply-button">Apply Now</button>
          <button className="catalog-button">View More</button>
        </div>
      </div>
    </div>
  );
};

export default ComputerPackages;
