
import AboutIntro from "../components/AboutIntro";
import WhyChooseUs from "../components/WhyChooseUs";
import MissionVisionValues from "../components/MissionVisionValues";
import AboutZane from "../components/AboutZane";
import CoursesOffered from "../components/CoursesOffered";
import AdmissionCards from "../components/AdmissionCards";
import Seo from "../components/Seo";

const AboutUs = () => {
  return (
    <div>
      <Seo
        title="About Us"
        description="Learn about Zane Driving School, our mission, training approach, and why students choose us for driving and computer education in Kenya."
        path="/about-us"
      />
      <AdmissionCards />
     

      <AboutZane />
      <WhyChooseUs />
      <CoursesOffered />

      <MissionVisionValues />
    </div>
  );
};

export default AboutUs;
