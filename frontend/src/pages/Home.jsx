
import { Link } from 'react-router-dom'
import Carousel from '../components/Carousel'
import ParallaxOffers from '../components/ParallaxOffers'
import CampusLocations from '../components/CampusLocations'
import Seo from '../components/Seo'
import '../styles/Home.css'

const Home = () => {
  return (
    <main className="home-page">
      <Seo
        title="Driving and Computer Training in Kenya"
        description="Join Zane Driving School for professional driving lessons and practical computer training in Kenya with certified instructors and flexible schedules."
        path="/"
      />
      <section className="home-intro" aria-labelledby="home-intro-title">
        <div className="home-intro-copy">
          <p className="home-intro-kicker">Driving school and computer college in Nakuru</p>
          <h1 id="home-intro-title">Professional driving lessons and computer training built for job-ready skills</h1>
          <p className="home-intro-text">
            Zane Driving School offers practical driver training, refresher courses, endorsement classes,
            and computing courses for students in Nakuru, Kwa Gitau, and Kericho. Our programs focus on
            real road confidence, digital skills, and flexible enrollment for new learners and working adults.
          </p>
          <div className="home-intro-actions">
            <Link to="/enroll" className="home-intro-primary">Start Enrollment</Link>
            <Link to="/courses" className="home-intro-secondary">Explore Courses</Link>
          </div>
          <div className="home-intro-links">
            <Link to="/driving">Driving courses</Link>
            <Link to="/computing">Computing courses</Link>
            <Link to="/fees-structure">Fees structure</Link>
            <Link to="/contact-us">Contact campus</Link>
          </div>
        </div>
        <div className="home-intro-highlights" aria-label="Key highlights">
          <article>
            <strong>Practical training</strong>
            <span>Hands-on sessions for beginners, endorsement applicants, and refresher learners.</span>
          </article>
          <article>
            <strong>Flexible campuses</strong>
            <span>Study from Nakuru, Kwa Gitau, or Kericho with support from the Zane team.</span>
          </article>
          <article>
            <strong>Affordable programs</strong>
            <span>Clear course fees and package options for both driving and computer classes.</span>
          </article>
        </div>
      </section>
      <Carousel/>
      <ParallaxOffers/>
      <CampusLocations/>
      </main>
  )
}

export default Home
