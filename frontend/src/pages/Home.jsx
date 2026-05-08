
import { Link } from 'react-router-dom'
import HomeSeo from './HomeSeo'
import Carousel from '../components/Carousel'
import ParallaxOffers from '../components/ParallaxOffers'
import CampusLocations from '../components/CampusLocations'
import StudentTestimonials from '../components/StudentTestimonials'
import '../styles/Home.css'

const Home = () => {
  return (
    <main className="home-page">
      <HomeSeo />
      <Carousel/>
      <ParallaxOffers/>
      <StudentTestimonials />
      <CampusLocations/>
      </main>
  )
}

export default Home
