import Sidebar from './Sidebar';
import '../styles/AdminLayout.css';
import PropTypes from 'prop-types';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-container">
      <Sidebar />
      <main className="admin-content">
        <div className="admin-main-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminLayout;
