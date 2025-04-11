import React, { useContext } from 'react';
import { Link, useHistory } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const history = useHistory();
  
  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <div className="mobile-menu-toggle">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div className="header-center">
        <div className="search-bar">
          <input type="text" placeholder="Search..." />
          <button className="search-button">
            <i className="search-icon"></i>
          </button>
        </div>
      </div>
      
      <div className="header-right">
        <div className="header-actions">
          <div className="notification-bell">
            <i className="notification-icon"></i>
            <span className="notification-badge">3</span>
          </div>
          
          <div className="user-dropdown">
            <div className="user-avatar">
              {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="dropdown-content">
              <Link to="/settings/profile">Profile</Link>
              <Link to="/settings/preferences">Preferences</Link>
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
