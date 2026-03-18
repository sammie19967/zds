import "../styles/ComputerPackages.css";
import computerImage from "../assets/computer.png";

const ComputerPackages = () => {
  return (
    <div className="computer-container">
      <div className="computer-image">
        <img
          src={computerImage}
          alt="Students learning computer skills at Zane Driving School"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="computer-content">
        <h2>Master Essential Computer Skills</h2>
        <p>
          Enroll in our comprehensive computer packages and gain hands-on experience
          with practical digital skills for school, work, and business.
        </p>

        <ul className="computer-list">
          <li>Introduction to Computers</li>
          <li>Microsoft Office Suite: Word, Excel, and PowerPoint</li>
          <li>Internet and Email Essentials</li>
          <li>Data Management and File Organization</li>
          <li>Graphic Design Basics with Canva and Photoshop</li>
          <li>Basic Data Analysis with Excel</li>
        </ul>

        <div className="computer-price">Only Ksh 15,000</div>

        <div className="computer-buttons">
          <button className="apply-button">Apply Now</button>
          <button className="catalog-button">View More</button>
        </div>
      </div>
    </div>
  );
};

export default ComputerPackages;
