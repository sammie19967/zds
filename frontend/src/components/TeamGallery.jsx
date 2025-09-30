import  { useState } from 'react';
import { Users, Camera, Mail, Phone, Award, Calendar } from 'lucide-react';
import '../styles/TeamGallery.css';
import sharonImage from '../assets/team/sharon.jpg';
import rotokImage from '../assets/rotok project.jpg';
import zaneImage from '../assets/zane community.jpg';
import zaneStudentsImage from '../assets/zane students.jpg';
import basicMechanicsImage from '../assets/basic mechanics.jpg';
import zaneComputerImage from '../assets/zane computer.jpg';
import project2Image from '../assets/project 2.jpg';
import zaneGearsImage from '../assets/zane gears.jpg';
import zaneHonWalterTenoImage from '../assets/zane hon walter teno.jpg';
import zaneClassImage from '../assets/zane class.jpg';
import zaneShirtImage from '../assets/zane shirt.jpg';
import zaneTshirtBlueImage from '../assets/zane tshirt blue.jpg';


const TeamGalleryComponent = () => {
  const [activeTab, setActiveTab] = useState('team');

  const teamMembers = [
    {
      id: 1,
      name: "Ms. Sharon Retet",
      role: "Principal",
      image: sharonImage,
      email: "sarah.johnson@school.edu",
      phone: "+1 (555) 123-4567",
      experience: "5 years",
      education: "PhD Commerce",
      description: "Passionate about creating an inclusive learning environment that fosters academic excellence and personal growth."
    },
    {
      id: 2,
      name: "Mr. Daniel Pamba",
      role: "Senior Instructor",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face",
      email: "michael.chen@school.edu",
      phone: "+1 (555) 123-4568",
      experience: "18 years",
      education: "MBA in Human Resources",
      description: "Dedicated to building strong teams and maintaining a positive workplace culture for all staff members."
    },
    {
      id: 3,
      name: "Felix Ombogo",
      role: "Instructor",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face",
      email: "emily.rodriguez@school.edu",
      phone: "+1 (555) 123-4569",
      experience: "10 years",
      education: "CPA, Bachelor's in Accounting",
      description: "Ensures financial transparency and responsible budget management to support educational initiatives."
    },
    {
      id: 4,
      name: "Sammie Barasa",
      role: "IT Specialist",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      email: "david.kim@school.edu",
      phone: "+1 (555) 123-4570",
      experience: "3 years",
      education: "MS in Computer Science",
      description: "Maintains and develops technology infrastructure to enhance learning experiences and administrative efficiency."
    },
    {
      id: 5,
      name: "John Mwenda",
      role: "Senior Instructor",
      image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=300&fit=crop&crop=face",
      email: "maria.santos@school.edu",
      phone: "+1 (555) 123-4571",
      experience: "12 years",
      education: "MS in Mathematics Education",
      description: "Inspiring students through innovative teaching methods and personalized learning approaches."
    },
    {
      id: 6,
      name: "Justus Ontuoma",
      role: "Instructor",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face",
      email: "james.wilson@school.edu",
      phone: "+1 (555) 123-4572",
      experience: "5 years",
      education: "MA in English Literature",
      description: "Passionate about literature and creative writing, helping students develop strong communication skills."
    }
  ];

  const galleryImages = [
    {
      id: 1,
      url: rotokImage,
      caption: "MCA Hon. Kiptisya Rotok, Rongai ward, Nakuru"
    },
    {
      id: 2,
      url: zaneImage,
      caption: "Boda Boda Community OlRongai"
    },
    {
      id: 3,
      url: zaneStudentsImage,
      caption: "Students"
    },
    {
      id: 4,
      url: basicMechanicsImage,
      caption: "Basic Mechanics"
    },
    {
      id: 5,
      url: zaneComputerImage,
      caption: "Computer Lab"
    },
    {
      id: 6,
      url: project2Image,
      caption: "Project 2"
    },
    {
      id: 7,
      url: zaneGearsImage,
      caption: "Gears OverView"
    },
    {
      id: 8,
      url: zaneHonWalterTenoImage,
      caption: "Hon. Walter Teno, Nandi County"
    },
    {
      id: 9,
      url: zaneClassImage,
      caption: "Mr. Daniel Pamba Teaching Model Town Board"
    },
    {
      id: 10,
      url: zaneShirtImage,
      caption: "Zane driving school Shirt"
    },
    {
      id: 11,
      url: zaneTshirtBlueImage,
      caption: "Blue T-shirt"
    }
  ];

  const TeamSection = () => (
    <div className="team-grid">
      {teamMembers.map((member) => (
        <div key={member.id} className="team-card">
          <div className="card-image-container">
            <img
              src={member.image}
              alt={member.name}
              className="card-image"
            />
            <div className="role-badge">
              {member.role}
            </div>
          </div>
          
          <div className="card-content">
            <h3 className="member-name">{member.name}</h3>
            <p className="member-description">{member.description}</p>
            
            <div className="member-details">
              <div className="detail-item">
                <Award className="detail-icon" />
                <span>{member.education}</span>
              </div>
              <div className="detail-item">
                <Calendar className="detail-icon" />
                <span>{member.experience} experience</span>
              </div>
            </div>
            
            <div className="contact-info">
              <div className="contact-item">
                <Mail className="contact-icon" />
                <a href={`mailto:${member.email}`} className="contact-link">
                  {member.email}
                </a>
              </div>
              <div className="contact-item">
                <Phone className="contact-icon" />
                <a href={`tel:${member.phone}`} className="contact-link">
                  {member.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const GallerySection = () => (
    <div className="gallery-grid">
      {galleryImages.map((image) => (
        <div key={image.id} className="gallery-item">
          <div className="gallery-image-container">
            <img
              src={image.url}
              alt={image.caption}
              className="gallery-image"
            />
          </div>
          <div className="gallery-overlay">
            <div className="gallery-caption">
              <p>{image.caption}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <h1 className="main-title">Our Organization</h1>
          <p className="subtitle">
            Meet our dedicated team and explore our facilities through our gallery
          </p>
        </div>

        {/* Navigation Menu */}
        <div className="nav-container">
          <div className="nav-menu">
            <button
              onClick={() => setActiveTab('team')}
              className={`nav-button ${activeTab === 'team' ? 'nav-button-active' : ''}`}
            >
              <Users className="nav-icon" />
              Our Team
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`nav-button ${activeTab === 'gallery' ? 'nav-button-active' : ''}`}
            >
              <Camera className="nav-icon" />
              Gallery
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="main-content">
          {activeTab === 'team' && <TeamSection />}
          {activeTab === 'gallery' && <GallerySection />}
        </div>
      </div>
    </div>
  );
};

export default TeamGalleryComponent;