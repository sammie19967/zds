import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const ScrollToTop = ({ behavior = 'smooth' }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top whenever the path changes
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, behavior]);

  return null;
};

ScrollToTop.propTypes = {
  behavior: PropTypes.oneOf(['auto', 'smooth'])
};

export default ScrollToTop;
