
import Carousel from '../components/Carousel'
import ParallaxOffers from '../components/ParallaxOffers'
import CampusLocations from '../components/CampusLocations'
import Seo from '../components/Seo'

const Home = () => {
  return (
    <div>
      <Seo
        title="Driving and Computer Training in Kenya"
        description="Join Zane Driving School for professional driving lessons and practical computer training in Kenya with certified instructors and flexible schedules."
        path="/"
      />
      <Carousel/>
      <ParallaxOffers/>
      <CampusLocations/>
      </div>
  )
}

export default Home
