import React from 'react'
import Carousel from '../components/Carousel'
import WhyChooseUs from '../components/WhyChooseUs'
import NewDriverOffer from '../components/NewDriverOffer'
import ParallaxOffers from '../components/ParallaxOffers'
import Reviews from '../components/Reviews'
import WhatsAppIcon from '../components/WhatsappIcon'

const Home = () => {
  return (
    <div>
      <Carousel/>
      <WhyChooseUs/>
      <ParallaxOffers/>
      <Reviews/>
      <WhatsAppIcon/>
    </div>
  )
}

export default Home
