import React from 'react'
import TeamGalleryComponent from '../components/TeamGallery'
import Seo from '../components/Seo'

const OurTeam = () => {
  return (
    <div>
      <Seo
        title="Our Team"
        description="Meet the instructors and team behind Zane Driving School and learn who supports our driving and computer training programs."
        path="/our-team"
      />
      <TeamGalleryComponent/>
    </div>
  )
}

export default OurTeam
