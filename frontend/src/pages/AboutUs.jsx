
import AboutIntro from "../components/AboutIntro";
import WhyChooseUs from "../components/WhyChooseUs";
import MissionVisionValues from "../components/MissionVisionValues";
import AboutZane from "../components/AboutZane";
import CoursesOffered from "../components/CoursesOffered";
import AdmissionCards from "../components/AdmissionCards";

const AboutUs = () => {
  return (
    <div>
      <AdmissionCards />
     

      <AboutZane />
      <WhyChooseUs />
      <CoursesOffered />

      <MissionVisionValues />
    </div>
  );
};

export default AboutUs;
