import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaUserPlus, 
  FaUsers, 
  FaMoneyBillWave, 
  FaGasPump,
  FaSignOutAlt,
  FaUserCircle,
  FaEnvelope
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { signOutUser } from '../../utils/firebase';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('Admin User');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const formatDisplayName = (name) => {
    if (!name) return 'ADMIN USER';
    // Convert to uppercase and handle multiple words
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    if (user) {
      // Extract and format display name from auth user
      const name = user.displayName || user.email?.split('@')[0] || 'admin user';
      setDisplayName(formatDisplayName(name));
      setEmail(user.email || '');
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      await signOutUser();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/admin', 
      icon: <FaTachometerAlt />
    },
    { 
      name: 'Register Student', 
      path: '/admin/register', 
      icon: <FaUserPlus /> 
    },
    { 
      name: 'Students', 
      path: '/admin/students', 
      icon: <FaUsers /> 
    },
    { 
      name: 'Fees', 
      path: '/admin/fees', 
      icon: <FaMoneyBillWave /> 
    },
    { 
      name: 'Fuel', 
      path: '/admin/fuel', 
      icon: <FaGasPump /> 
    },
    { 
      name: 'Enquiries', 
      path: '/admin/enquiries', 
      icon: <FaEnvelope /> 
    }
  ];


  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Zane Driving</h2>
        <p>Admin Panel</p>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                end={item.path === '/admin/dashboard'}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={displayName} 
                className="user-avatar-img"
              />
            ) : (
              <FaUserCircle className="default-avatar" />
            )}
          </div>
          <div className="user-info">
            <p className="username" title={displayName}>
              {displayName.length > 15 ? `${displayName.substring(0, 15)}...` : displayName}
            </p>
            <p className="user-email" title={email}>
              {email || 'Administrator'}
            </p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
