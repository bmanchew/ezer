import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  // Check if current path matches the link
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <h2>EzerAI</h2>
        </div>
        <div className="user-info">
          <div className="avatar">
            {user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user ? user.name : 'User'}</div>
            <div className="user-role">Sales Manager</div>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li className={isActive('/dashboard') ? 'active' : ''}>
            <Link to="/dashboard">
              <i className="icon dashboard-icon"></i>
              <span>Dashboard</span>
            </Link>
          </li>
          
          <li className="nav-section">
            <span className="section-title">Core Features</span>
          </li>
          
          <li className={isActive('/ai-training') ? 'active' : ''}>
            <Link to="/ai-training">
              <i className="icon training-icon"></i>
              <span>AI Sales Training</span>
            </Link>
          </li>
          
          <li className={isActive('/lead-predictability') ? 'active' : ''}>
            <Link to="/lead-predictability">
              <i className="icon predictability-icon"></i>
              <span>Lead Predictability</span>
            </Link>
          </li>
          
          <li className="nav-section">
            <span className="section-title">Integrations</span>
          </li>
          
          <li className={isActive('/integrations/shifi') ? 'active' : ''}>
            <Link to="/integrations/shifi">
              <i className="icon shifi-icon"></i>
              <span>ShiFi Integration</span>
            </Link>
          </li>
          
          <li className={isActive('/integrations/crm') ? 'active' : ''}>
            <Link to="/integrations/crm">
              <i className="icon crm-icon"></i>
              <span>CRM Integrations</span>
            </Link>
          </li>
          
          <li className={isActive('/engagement-tracking') ? 'active' : ''}>
            <Link to="/engagement-tracking">
              <i className="icon tracking-icon"></i>
              <span>Engagement Tracking</span>
            </Link>
          </li>
          
          <li className="nav-section">
            <span className="section-title">Settings</span>
          </li>
          
          <li className={isActive('/settings/profile') ? 'active' : ''}>
            <Link to="/settings/profile">
              <i className="icon profile-icon"></i>
              <span>Profile</span>
            </Link>
          </li>
          
          <li className={isActive('/settings/team') ? 'active' : ''}>
            <Link to="/settings/team">
              <i className="icon team-icon"></i>
              <span>Team Management</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="version">Version 1.0.0</div>
        <div className="help-link">
          <Link to="/help">
            <i className="icon help-icon"></i>
            <span>Help & Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
