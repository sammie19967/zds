import React from 'react'
import CatalogMessage from '../components/CatalogMessage'
import NewStudentOffer from '../components/NewStudentOffer'
import ComputerPackages from '../components/ComputerPackages'
import Refresher from '../components/Refresher'
import ComputingCatalog from './ComputingCatalog'
import DrivingCatalog from './DrivingCatalog'

const Courses = () => {
  return (
    <div>
      <CatalogMessage/>
      <NewStudentOffer/>
      <ComputerPackages/>
      <Refresher/>
      <ComputingCatalog/>
      <DrivingCatalog/>
    </div>
  )
}

export default Courses
