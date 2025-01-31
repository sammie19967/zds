import React from 'react'
import AboutIntro from '../components/AboutIntro'
import WhyChooseUs from '../components/WhyChooseUs'
import WhatsAppIcon from '../components/WhatsappIcon'
import MissionVisionValues from '../components/MissionVisionValues'
import AboutZane from '../components/AboutZane'
import CoursesOffered from '../components/CoursesOffered'
import AdmissionCards from '../components/AdmissionCards'

const AboutUs = () => {
  return (
    <div>
     <AboutIntro/>
     <AdmissionCards/>
     <AboutZane/>
     <WhyChooseUs/>
     <CoursesOffered/>
     <WhatsAppIcon/>
     <MissionVisionValues/>

    </div>
  )
}

export default AboutUs
