import { Link } from 'react-router-dom';
import '../styles/NewDriverOffer.css';
import newDriverImage from '../assets/computer-course.png';

const NewDriverOffer = () => {
  return (
    <div className="new-driver-offer-container">
      <div className="offer-image">
        <img src={newDriverImage} alt="Driving course offer at Zane Driving School" loading="lazy" decoding="async" />
      </div>
      <div className="offer-content">
        <h2>Special Offer for New Drivers</h2>
        <p>
          Kickstart your driving journey with our comprehensive beginner&apos;s driving course! 
          Learn essential skills, traffic rules, and road safety practices from certified instructors.
        </p>
        <p className="offer-price">Price: <span>Ksh 1500</span></p>
        <Link to="/driving" className="offer-button">View Full Catalogue</Link>
      </div>
    </div>
  );
};

export default NewDriverOffer;
