import React from 'react'
import CatalogMessage from '../components/CatalogMessage'
import NewStudentOffer from '../components/NewStudentOffer'
import ComputerPackages from '../components/ComputerPackages'
import Refresher from '../components/Refresher'
import ComputingCatalog from './ComputingCatalog'

const Courses = () => {
  return (
    <div>
      <CatalogMessage/>
      <NewStudentOffer/>
      <ComputerPackages/>
      <Refresher/>
      <ComputingCatalog/>
    </div>
  )
}

export default Courses
