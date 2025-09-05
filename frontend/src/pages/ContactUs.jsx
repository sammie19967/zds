import { useState } from 'react';
import modal from '../utils/modal';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock, FaQuoteLeft, FaPaperPlane, FaWhatsapp } from 'react-icons/fa';
import { submitContactMessage } from '../utils/firebase';
import CampusLocations from '../components/CampusLocations';
import '../styles/ContactUs.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitContactMessage(formData);
      await modal.success({
        title: 'Message sent!',
        text: 'Thank you for your message. We will get back to you soon.',
      });
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: ''
      });
    } catch (err) {
      console.error(err);
      await modal.error({
        title: 'Submission failed',
        text: err?.message || 'We could not send your message. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const testimonials = [
    {
      id: 1,
      text: "The training at Zane Driving School was exceptional. The instructors were patient and professional. I passed my driving test on the first try!",
      author: "John Mwangi",
      role: "Driving Student",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      id: 2,
      text: "The computer classes are well-structured and the trainers are knowledgeable. I gained practical skills that helped me secure a job immediately after completion.",
      author: "Sarah Wanjiku",
      role: "Computer Student",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      id: 3,
      text: "Professional and reliable service. The school has modern vehicles and excellent training facilities. Highly recommended for anyone looking to learn driving.",
      author: "David Ochieng",
      role: "Driving Student",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg"
    }
  ];

  return (
    <div className="contact-page">
      {/* Header Section */}
      <div className="contact-hero">
        <div className="hero-content">
          <h1>Get In Touch With Us</h1>
          <p>Have questions or need assistance? We&apos;re here to help! Reach out through any channel and we'll respond promptly.</p>
          <div className="hero-cta">
            <div className="cta-item">
              <div className="cta-icon">
                <FaPhoneAlt />
              </div>
              <span>+254 115 820 508</span>
            </div>
            <div className="cta-item">
              <div className="cta-icon">
                <FaEnvelope />
              </div>
              <span>zanedrivingschool2022@gmail.com</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card">
            <div className="card-icon">
              <FaPaperPlane />
            </div>
            <h3>Send us a message</h3>
            <p>We typically respond within 24 hours</p>
          </div>
        </div>
      </div>

      {/* Contact Grid */}
      <div className="contact-container">
        <div className="contact-grid">
          {/* Contact Form */}
          <div className="contact-form-section">
            <div className="section-header">
              <h2>Send Us a Message</h2>
              <p>Fill out the form below and we&apos;ll get back to you as soon as possible</p>
            </div>
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    className="form-control"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Driving Lessons">Driving Lessons</option>
                    <option value="Computer Classes">Computer Classes</option>
                    <option value="Certification">Certification</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="message">Your Message *</label>
                <textarea
                  id="message"
                  name="message"
                  className="form-control"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="contact-info-section">
            <div className="section-header">
              <h2>Contact Information</h2>
              <p>Feel free to reach out through any of these channels</p>
            </div>
            
            <div className="contact-methods">
              <div className="contact-method">
                <div className="method-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="method-details">
                  <h3>Our Location</h3>
                  <p>Mercy Njeri along Kabarak Road, Nakuru, Kenya</p>
                </div>
              </div>

              <div className="contact-method">
                <div className="method-icon">
                  <FaPhoneAlt />
                </div>
                <div className="method-details">
                  <h3>Phone</h3>
                  <p><a href="tel:+254715820508">+254 115 820 508</a></p>
                  <p><a href="tel:+254715820509">+254 115 820 509</a></p>
                </div>
              </div>

              <div className="contact-method">
                <div className="method-icon">
                  <FaWhatsapp />
                </div>
                <div className="method-details">
                  <h3>WhatsApp</h3>
                  <p><a href="https://wa.me/254715820508" target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</a></p>
                </div>
              </div>

              <div className="contact-method">
                <div className="method-icon">
                  <FaEnvelope />
                </div>
                <div className="method-details">
                  <h3>Email</h3>
                  <p><a href="mailto:zanedrivingschool2022@gmail.com">zanedrivingschool2022@gmail.com</a></p>
                </div>
              </div>

              <div className="contact-method">
                <div className="method-icon">
                  <FaClock />
                </div>
                <div className="method-details">
                  <h3>Working Hours</h3>
                  <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                  <p>Saturday: 9:00 AM - 2:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Why Choose Us?</h3>
              <ul>
                <li>Certified and experienced instructors</li>
                <li>Modern training facilities</li>
                <li>Flexible learning schedules</li>
                <li>Affordable pricing options</li>
                <li>High success rate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="testimonials-section">
        <div className="section-header center">
          <h2>What Our Students Say</h2>
          <p>Don&apos;t just take our word for it. Here&apos;s what our students have to say about their experience with us.</p>
        </div>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-content">
                <FaQuoteLeft className="quote-icon" />
                <p>{testimonial.text}</p>
              </div>
              <div className="testimonial-author">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.author} 
                  className="author-avatar" 
                />
                <div className="author-details">
                  <h4>{testimonial.author}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CampusLocations />
    </div>
  );
};

export default ContactUs;