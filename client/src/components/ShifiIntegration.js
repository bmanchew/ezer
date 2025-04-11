import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ShifiIntegration.css';

const ShifiIntegration = () => {
  const [integrationStatus, setIntegrationStatus] = useState({
    status: 'loading',
    expires_at: null,
    connected_at: null
  });
  
  const [voiceModels, setVoiceModels] = useState([]);
  const [aiModels, setAiModels] = useState([]);
  const [appStoreStatus, setAppStoreStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch integration status
  const fetchIntegrationStatus = async () => {
    try {
      const res = await axios.get('/api/shifi/status');
      setIntegrationStatus(res.data);
    } catch (err) {
      console.error('Error fetching ShiFi integration status:', err);
      setError('Failed to load integration status');
    }
  };

  // Fetch voice models if connected
  const fetchVoiceModels = async () => {
    if (integrationStatus.status !== 'connected') return;
    
    try {
      const res = await axios.get('/api/shifi/voice/models');
      setVoiceModels(res.data.models || []);
    } catch (err) {
      console.error('Error fetching voice models:', err);
    }
  };

  // Fetch AI models if connected
  const fetchAiModels = async () => {
    if (integrationStatus.status !== 'connected') return;
    
    try {
      const res = await axios.get('/api/shifi/ai/models');
      setAiModels(res.data.models || []);
    } catch (err) {
      console.error('Error fetching AI models:', err);
    }
  };

  // Fetch app store status if connected
  const fetchAppStoreStatus = async () => {
    if (integrationStatus.status !== 'connected') return;
    
    try {
      const res = await axios.get('/api/shifi/app-store/status');
      setAppStoreStatus(res.data);
    } catch (err) {
      console.error('Error fetching app store status:', err);
    }
  };

  // Connect to ShiFi
  const connectToShifi = async () => {
    try {
      const res = await axios.get('/api/shifi/auth');
      window.location.href = res.data.authUrl;
    } catch (err) {
      console.error('Error getting ShiFi auth URL:', err);
      setError('Failed to initiate ShiFi connection');
    }
  };

  // Disconnect from ShiFi
  const disconnectFromShifi = async () => {
    try {
      await axios.post('/api/shifi/disconnect');
      setIntegrationStatus({ status: 'not_connected' });
    } catch (err) {
      console.error('Error disconnecting from ShiFi:', err);
      setError('Failed to disconnect from ShiFi');
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchIntegrationStatus();
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Load additional data when connected
  useEffect(() => {
    if (integrationStatus.status === 'connected') {
      fetchVoiceModels();
      fetchAiModels();
      fetchAppStoreStatus();
    }
  }, [integrationStatus.status]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Render connection status
  const renderConnectionStatus = () => {
    if (loading) {
      return <div className="loading">Loading integration status...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    switch (integrationStatus.status) {
      case 'connected':
        return (
          <div className="status-card connected">
            <div className="status-icon">✓</div>
            <div className="status-details">
              <h3>Connected to ShiFi</h3>
              <p>Connected since: {formatDate(integrationStatus.connected_at)}</p>
              <p>Token expires: {formatDate(integrationStatus.expires_at)}</p>
              <button 
                className="btn-secondary"
                onClick={disconnectFromShifi}
              >
                Disconnect
              </button>
            </div>
          </div>
        );
      
      case 'token_expired':
        return (
          <div className="status-card expired">
            <div className="status-icon">!</div>
            <div className="status-details">
              <h3>Connection Expired</h3>
              <p>Your connection to ShiFi has expired.</p>
              <button 
                className="btn-primary"
                onClick={connectToShifi}
              >
                Reconnect
              </button>
            </div>
          </div>
        );
      
      case 'disconnected':
        return (
          <div className="status-card disconnected">
            <div className="status-icon">✗</div>
            <div className="status-details">
              <h3>Disconnected from ShiFi</h3>
              <p>Your app is currently disconnected from ShiFi.</p>
              <button 
                className="btn-primary"
                onClick={connectToShifi}
              >
                Connect
              </button>
            </div>
          </div>
        );
      
      case 'not_connected':
      default:
        return (
          <div className="status-card not-connected">
            <div className="status-icon">?</div>
            <div className="status-details">
              <h3>Not Connected to ShiFi</h3>
              <p>Connect to ShiFi to enable voice engine, AI model, and app store features.</p>
              <button 
                className="btn-primary"
                onClick={connectToShifi}
              >
                Connect
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="module-container shifi-integration-module">
      <div className="module-header">
        <h2 className="module-title">ShiFi Integration</h2>
        <p className="module-description">Connect with ShiFi to enable voice engine, AI model, and app store features</p>
      </div>
      
      <div className="integration-status-section">
        {renderConnectionStatus()}
      </div>
      
      {integrationStatus.status === 'connected' && (
        <>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Voice Engine</div>
            </div>
            <div className="card-body">
              <div className="feature-description">
                <h3>ShiFi Voice Engine</h3>
                <p>Use ShiFi's voice engine to transcribe audio and synthesize speech for your sales training and coaching.</p>
                
                {voiceModels.length > 0 ? (
                  <div className="models-list">
                    <h4>Available Voice Models</h4>
                    <ul>
                      {voiceModels.map(model => (
                        <li key={model.id}>
                          <strong>{model.name}</strong> - {model.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>Voice models information will appear here once available.</p>
                )}
                
                <div className="demo-section">
                  <h4>Voice Engine Demo</h4>
                  <div className="demo-controls">
                    <button className="btn-primary">Transcribe Sample Audio</button>
                    <button className="btn-primary">Synthesize Sample Text</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <div className="card-title">AI Model</div>
            </div>
            <div className="card-body">
              <div className="feature-description">
                <h3>ShiFi AI Model</h3>
                <p>Leverage ShiFi's AI model for advanced analytics, insights, and recommendations.</p>
                
                {aiModels.length > 0 ? (
                  <div className="models-list">
                    <h4>Available AI Models</h4>
                    <ul>
                      {aiModels.map(model => (
                        <li key={model.id}>
                          <strong>{model.name}</strong> - {model.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>AI models information will appear here once available.</p>
                )}
                
                <div className="demo-section">
                  <h4>AI Model Demo</h4>
                  <div className="demo-controls">
                    <button className="btn-primary">Analyze Sample Data</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <div className="card-title">App Store</div>
            </div>
            <div className="card-body">
              <div className="feature-description">
                <h3>ShiFi App Store</h3>
                <p>Manage your app's presence in the ShiFi App Store.</p>
                
                {appStoreStatus ? (
                  <div className="app-store-status">
                    <h4>App Store Status</h4>
                    <div className="status-details">
                      <p><strong>Listing Status:</strong> {appStoreStatus.status}</p>
                      <p><strong>Last Updated:</strong> {formatDate(appStoreStatus.last_updated)}</p>
                      <p><strong>Downloads:</strong> {appStoreStatus.downloads || 0}</p>
                      <p><strong>Rating:</strong> {appStoreStatus.rating || 'N/A'}</p>
                    </div>
                  </div>
                ) : (
                  <p>App store status information will appear here once available.</p>
                )}
                
                <div className="app-store-actions">
                  <button className="btn-primary">Update App Listing</button>
                  <button className="btn-secondary">View Analytics</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      <div className="card">
        <div className="card-header">
          <div className="card-title">About ShiFi Integration</div>
        </div>
        <div className="card-body">
          <p>Integrating with ShiFi provides these key benefits:</p>
          <ul className="feature-list">
            <li><strong>Voice Engine:</strong> Transcribe calls and synthesize speech for training</li>
            <li><strong>AI Model:</strong> Access advanced AI capabilities for deeper insights</li>
            <li><strong>App Store:</strong> Distribute your app through ShiFi's marketplace</li>
            <li><strong>Single Sign-On:</strong> Allow users to access your app with their ShiFi credentials</li>
          </ul>
          <p>The integration uses OAuth 2.0 for secure authentication and API access.</p>
        </div>
      </div>
    </div>
  );
};

export default ShifiIntegration;
