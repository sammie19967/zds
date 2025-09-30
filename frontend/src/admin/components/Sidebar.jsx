import { NavLink } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaUserPlus, 
  FaUsers, 
  FaMoneyBillWave, 
  FaGasPump,
  FaSignOutAlt,
  FaUserCircle,
  FaEnvelope,
  FaFileInvoiceDollar,
  FaChevronLeft,
  FaChevronRight
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  const toggleCollapse = () => setIsCollapsed((v) => !v);
  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/admin/dashboard', 
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
    },
    { 
      name: 'Expenses', 
      path: '/admin/expenses', 
      icon: <FaFileInvoiceDollar /> 
    }
  ];


  return (
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="brand">
          <img src="/logo.png" alt="Zane Driving" className="sidebar-logo" />
          <div className="brand-text">
            <h2>Zane Driving</h2>
            <p>Admin Panel</p>
          </div>
        </div>
        <button
          className="toggle-btn"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={toggleCollapse}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
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
                title={isCollapsed ? item.name : undefined}
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
        <button className="logout-btn" onClick={handleLogout} title={isCollapsed ? 'Sign Out' : undefined}>
          <FaSignOutAlt />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
