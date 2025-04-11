import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    leads: 0,
    engagements: 0,
    deals: 0,
    revenue: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard data in parallel
        const [statsRes, activityRes, tasksRes] = await Promise.all([
          axios.get('/api/dashboard/stats'),
          axios.get('/api/dashboard/activity'),
          axios.get('/api/dashboard/tasks')
        ]);
        
        setStats(statsRes.data);
        setRecentActivity(activityRes.data);
        setUpcomingTasks(tasksRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user ? user.name : 'User'}!</h1>
        <p className="dashboard-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon leads-icon"></div>
          <div className="stat-content">
            <div className="stat-value">{stats.leads}</div>
            <div className="stat-label">Active Leads</div>
          </div>
          <div className="stat-change positive">+5% ↑</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon engagements-icon"></div>
          <div className="stat-content">
            <div className="stat-value">{stats.engagements}</div>
            <div className="stat-label">Engagements</div>
          </div>
          <div className="stat-change positive">+12% ↑</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon deals-icon"></div>
          <div className="stat-content">
            <div className="stat-value">{stats.deals}</div>
            <div className="stat-label">Open Deals</div>
          </div>
          <div className="stat-change negative">-2% ↓</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon revenue-icon"></div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.revenue)}</div>
            <div className="stat-label">Projected Revenue</div>
          </div>
          <div className="stat-change positive">+8% ↑</div>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card feature-card">
          <div className="card-header">
            <h2>AI Sales Training</h2>
            <Link to="/ai-training" className="view-all">View All</Link>
          </div>
          <div className="card-body">
            <div className="feature-progress">
              <div className="progress-label">
                <span>Your Progress</span>
                <span>65%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div className="feature-stats">
              <div className="feature-stat">
                <div className="stat-value">12</div>
                <div className="stat-label">Modules Completed</div>
              </div>
              <div className="feature-stat">
                <div className="stat-value">5</div>
                <div className="stat-label">Modules Remaining</div>
              </div>
              <div className="feature-stat">
                <div className="stat-value">8</div>
                <div className="stat-label">Coaching Sessions</div>
              </div>
            </div>
            <Link to="/ai-training" className="btn-primary">Continue Training</Link>
          </div>
        </div>
        
        <div className="dashboard-card feature-card">
          <div className="card-header">
            <h2>Lead Predictability</h2>
            <Link to="/lead-predictability" className="view-all">View All</Link>
          </div>
          <div className="card-body">
            <div className="lead-stats">
              <div className="lead-stat">
                <div className="stat-value">24</div>
                <div className="stat-label">High-Value Leads</div>
              </div>
              <div className="lead-stat">
                <div className="stat-value">18</div>
                <div className="stat-label">Ready to Convert</div>
              </div>
              <div className="lead-stat">
                <div className="stat-value">7</div>
                <div className="stat-label">At Risk</div>
              </div>
            </div>
            <div className="lead-actions">
              <Link to="/lead-predictability" className="btn-primary">View Lead Insights</Link>
              <Link to="/lead-predictability/constraints" className="btn-secondary">Analyze Constraints</Link>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Activity</h2>
            <Link to="/activity" className="view-all">View All</Link>
          </div>
          <div className="card-body">
            <div className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className={`activity-icon ${activity.type}-icon`}></div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-description">{activity.description}</div>
                    </div>
                    <div className="activity-time">
                      <div className="activity-date">{formatDate(activity.timestamp)}</div>
                      <div className="activity-hour">{formatTime(activity.timestamp)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No recent activity</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Upcoming Tasks</h2>
            <Link to="/tasks" className="view-all">View All</Link>
          </div>
          <div className="card-body">
            <div className="tasks-list">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task, index) => (
                  <div key={index} className="task-item">
                    <div className="task-checkbox">
                      <input type="checkbox" id={`task-${index}`} />
                      <label htmlFor={`task-${index}`}></label>
                    </div>
                    <div className="task-content">
                      <div className="task-title">{task.title}</div>
                      <div className="task-meta">
                        <span className="task-due">Due: {formatDate(task.due_date)}</span>
                        <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No upcoming tasks</div>
              )}
            </div>
            <button className="btn-primary">Add New Task</button>
          </div>
        </div>
        
        <div className="dashboard-card integration-card">
          <div className="card-header">
            <h2>Integrations</h2>
            <Link to="/integrations" className="view-all">Manage</Link>
          </div>
          <div className="card-body">
            <div className="integration-items">
              <div className="integration-item">
                <div className="integration-icon shifi-icon"></div>
                <div className="integration-content">
                  <div className="integration-name">ShiFi</div>
                  <div className="integration-status connected">Connected</div>
                </div>
                <Link to="/integrations/shifi" className="btn-small">Configure</Link>
              </div>
              
              <div className="integration-item">
                <div className="integration-icon ghl-icon"></div>
                <div className="integration-content">
                  <div className="integration-name">Go High Level</div>
                  <div className="integration-status connected">Connected</div>
                </div>
                <Link to="/integrations/crm" className="btn-small">Configure</Link>
              </div>
              
              <div className="integration-item">
                <div className="integration-icon hubspot-icon"></div>
                <div className="integration-content">
                  <div className="integration-name">HubSpot</div>
                  <div className="integration-status not-connected">Not Connected</div>
                </div>
                <Link to="/integrations/crm" className="btn-small">Connect</Link>
              </div>
              
              <div className="integration-item">
                <div className="integration-icon close-icon"></div>
                <div className="integration-content">
                  <div className="integration-name">Close</div>
                  <div className="integration-status not-connected">Not Connected</div>
                </div>
                <Link to="/integrations/crm" className="btn-small">Connect</Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card engagement-card">
          <div className="card-header">
            <h2>Engagement Tracking</h2>
            <Link to="/engagement-tracking" className="view-all">View Details</Link>
          </div>
          <div className="card-body">
            <div className="engagement-summary">
              <div className="engagement-stat">
                <div className="stat-value">152</div>
                <div className="stat-label">SMS Clicks</div>
              </div>
              <div className="engagement-stat">
                <div className="stat-value">89</div>
                <div className="stat-label">Ad Clicks</div>
              </div>
              <div className="engagement-stat">
                <div className="stat-value">214</div>
                <div className="stat-label">Website Visits</div>
              </div>
              <div className="engagement-stat">
                <div className="stat-value">67</div>
                <div className="stat-label">Facebook Ads</div>
              </div>
            </div>
            <Link to="/engagement-tracking" className="btn-primary">View Analytics</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
