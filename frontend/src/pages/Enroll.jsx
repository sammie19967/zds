
import AdmissionForm from '../components/AdmissionForm'

import FormMessage from '../components/FormMessage'
import Seo from '../components/Seo'

const Enroll = () => {
  return (
    <div className='enroll-page'>
      <Seo
        title="Enroll"
        description="Apply for driving or computer training at Zane Driving School using our online enrollment form and start your course registration."
        path="/enroll"
      />
      <FormMessage/>
      <AdmissionForm/>
      
    </div>
  )
}

export default Enroll
