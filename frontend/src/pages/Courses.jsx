
import CatalogMessage from '../components/CatalogMessage'
import ComputingCatalog from './ComputingCatalog'
import DrivingCatalog from './DrivingCatalog'
import Seo from '../components/Seo'

const Courses = () => {
  return (
    <div>
      <Seo
        title="Courses"
        description="Browse driving and computing courses at Zane Driving School, including beginner and intermediate computer classes and practical driver training."
        path="/courses"
      />
      <CatalogMessage/>
      <ComputingCatalog enableSeo={false} />
      <DrivingCatalog enableSeo={false} />
    </div>
  )
}

export default Courses
