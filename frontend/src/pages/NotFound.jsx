import Seo from '../components/Seo'

const NotFound = () => {
  return (
    <div>
      <Seo
        title="Page Not Found"
        description="The page you requested could not be found on Zane Driving School."
        path="/404"
        robots="noindex, nofollow"
      />
      Not Found
    </div>
  )
}

export default NotFound
