import "../styles/Footer.css";
import logo from "../assets/logo.png"; // Update this path to your logo's actual location
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-top">
        <div className="footer-section logo-section">
          <img src={logo} alt="Zane Driving School Logo" className="footer-logo" />
          <p>
            At Zane Driving School and Computing, we aim to equip you with the skills and confidence you need to excel. Drive with us into the future!
          </p>
        </div>

        <div className="footer-section links">
          <h2>Quick Links</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about-us">About Us</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/admission-form">Admissions</Link></li>
            <li><Link to="/contact-us">Contact Us</Link></li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h2>Contact Us</h2>
          <p><i className="fas fa-map-marker-alt"></i> Nakuru, Kericho</p>
          <p><i className="fas fa-phone-alt"></i> +254 15820508</p>
          <p><i className="fas fa-envelope"></i> zanedrivingschool2022@gmail.com</p>
          <p>
            <i className="fab fa-facebook-f"></i>{' '}
            <a href="https://www.facebook.com/profile.php?id=100084443037318" target="_blank" rel="noreferrer">
              Facebook
            </a>
          </p>
          <p><i className="fas fa-whatsapp"></i> +254 15820508</p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-social">
          <a href="https://www.facebook.com/profile.php?id=100084443037318" target="_blank" rel="noreferrer">
            <i className="fab fa-facebook-f"></i>
          </a>
          <a href="http://tiktok.com/@zanedrivingschool_3" target="_blank" rel="noreferrer">
            <i className="fab fa-tiktok"></i>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">
            <i className="fab fa-linkedin-in"></i>
          </a>
          <a href="https://wa.me/25415820508" target="_blank" rel="noreferrer">
            <i className="fab fa-whatsapp"></i>
          </a>
        </div>
        <p>© 2025 Zane Driving School and Computing. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
