
import "../styles/Reviews.css";
import aliceIcon from "../assets/alice.jpg"; 
import brianIcon from "../assets/brian.jpg";
import cynthiaIcon from "../assets/cynthia.jpg";
import davidIcon from "../assets/david.jpeg";

const reviews = [
  {
    name: "Alice Wanjiru",
    message:
      "Zane Driving School changed my life! The instructors were professional and patient. Highly recommend!",
    align: "left",
    icon: aliceIcon,
  },
  {
    name: "Brian Otieno",
    message:
      "The computer package offered alongside the driving course gave me a competitive edge in my career. Amazing experience!",
    align: "right",
    icon: brianIcon,
  },
  {
    name: "Cynthia Mwende",
    message:
      "I was nervous about driving, but the team made it so easy and enjoyable. Thank you, Zane!",
    align: "left",
    icon: cynthiaIcon,
  },
  {
    name: "David Njoroge",
    message:
      "Affordable and high-quality training. I passed my test on the first try thanks to their expert guidance.",
    align: "right",
    icon: davidIcon,
  },
];

const Reviews = () => {
  return (
    <section className="student-reviews-container">
      <h2 className="reviews-title">Student Reviews</h2>
      <div className="reviews-bubble-container">
        {reviews.map((review, index) => (
          <div
            className={`review-item ${
              review.align === "right" ? "align-right" : "align-left"
            }`}
            key={index}
          >
            <img
              src={review.icon}
              alt={review.name}
              className="review-icon"
            />
            <div className="review-bubble">
              <p className="review-message">“{review.message}”</p>
              <span className="review-name">- {review.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Reviews;
