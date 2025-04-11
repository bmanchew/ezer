import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import axios from 'axios';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AITrainingModule from './components/AITrainingModule';
import LeadPredictability from './components/LeadPredictability';
import ShifiIntegration from './components/ShifiIntegration';
import CRMIntegration from './components/CRMIntegration';
import EngagementTracking from './components/EngagementTracking';
import PrivateRoute from './components/PrivateRoute';

// Context
import AuthContext from './context/AuthContext';

// Styles
import './styles/App.css';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null
        });
        return;
      }
      
      try {
        // Set auth token in headers
        axios.defaults.headers.common['x-auth-token'] = token;
        
        const res = await axios.get('/api/auth');
        
        setAuthState({
          isAuthenticated: true,
          user: res.data,
          loading: false,
          error: null
        });
      } catch (err) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: err.response?.data?.msg || 'Authentication failed'
        });
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      
      setAuthState({
        isAuthenticated: true,
        user: res.data.user,
        loading: false,
        error: null
      });
      
      return true;
    } catch (err) {
      setAuthState({
        ...authState,
        error: err.response?.data?.msg || 'Login failed'
      });
      
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      
      setAuthState({
        isAuthenticated: true,
        user: res.data.user,
        loading: false,
        error: null
      });
      
      return true;
    } catch (err) {
      setAuthState({
        ...authState,
        error: err.response?.data?.msg || 'Registration failed'
      });
      
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null
    });
  };

  const clearError = () => {
    setAuthState({
      ...authState,
      error: null
    });
  };

  if (authState.loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      register, 
      logout,
      clearError
    }}>
      <Router>
        <div className="app">
          {authState.isAuthenticated && <Header />}
          <div className="main-container">
            {authState.isAuthenticated && <Sidebar />}
            <div className="content-container">
              <Switch>
                <Route exact path="/login" render={props => 
                  authState.isAuthenticated ? <Redirect to="/dashboard" /> : <Login {...props} />
                } />
                <Route exact path="/register" render={props => 
                  authState.isAuthenticated ? <Redirect to="/dashboard" /> : <Register {...props} />
                } />
                <PrivateRoute exact path="/dashboard" component={Dashboard} />
                <PrivateRoute exact path="/ai-training" component={AITrainingModule} />
                <PrivateRoute exact path="/lead-predictability" component={LeadPredictability} />
                <PrivateRoute exact path="/integrations/shifi" component={ShifiIntegration} />
                <PrivateRoute exact path="/integrations/crm" component={CRMIntegration} />
                <PrivateRoute exact path="/engagement-tracking" component={EngagementTracking} />
                <Route path="/" render={() => 
                  authState.isAuthenticated ? <Redirect to="/dashboard" /> : <Redirect to="/login" />
                } />
              </Switch>
            </div>
          </div>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
