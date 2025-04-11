import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/CRMIntegration.css';

const CRMIntegration = () => {
  const [activeTab, setActiveTab] = useState('ghl');
  const [integrationStatus, setIntegrationStatus] = useState({
    ghl: { status: 'loading' },
    close: { status: 'loading' },
    hubspot: { status: 'loading' }
  });
  
  const [syncStatus, setSyncStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch integration statuses
  const fetchIntegrationStatuses = async () => {
    try {
      const [ghlRes, closeRes, hubspotRes] = await Promise.all([
        axios.get('/api/crm/ghl/status'),
        axios.get('/api/crm/close/status'),
        axios.get('/api/crm/hubspot/status')
      ]);
      
      setIntegrationStatus({
        ghl: ghlRes.data,
        close: closeRes.data,
        hubspot: hubspotRes.data
      });
    } catch (err) {
      console.error('Error fetching integration statuses:', err);
      setError('Failed to load integration statuses');
    }
  };

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const res = await axios.get('/api/crm/sync/status');
      setSyncStatus(res.data);
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  };

  // Connect to CRM
  const connectToCRM = async (crm) => {
    try {
      const res = await axios.get(`/api/crm/${crm}/auth`);
      window.location.href = res.data.authUrl;
    } catch (err) {
      console.error(`Error getting ${crm} auth URL:`, err);
      setError(`Failed to initiate ${crm.toUpperCase()} connection`);
    }
  };

  // Disconnect from CRM
  const disconnectFromCRM = async (crm) => {
    try {
      await axios.post(`/api/crm/${crm}/disconnect`);
      
      setIntegrationStatus(prev => ({
        ...prev,
        [crm]: { status: 'not_connected' }
      }));
    } catch (err) {
      console.error(`Error disconnecting from ${crm}:`, err);
      setError(`Failed to disconnect from ${crm.toUpperCase()}`);
    }
  };

  // Sync data from CRM
  const syncData = async (source, entityType) => {
    try {
      const res = await axios.post('/api/crm/sync', {
        source,
        entity_type: entityType
      });
      
      // Refresh sync status after starting sync
      fetchSyncStatus();
      
      return res.data;
    } catch (err) {
      console.error(`Error syncing ${entityType} from ${source}:`, err);
      setError(`Failed to sync ${entityType} from ${source.toUpperCase()}`);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchIntegrationStatuses(),
          fetchSyncStatus()
        ]);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Render connection status
  const renderConnectionStatus = (crm) => {
    const status = integrationStatus[crm];
    
    if (status.status === 'loading') {
      return <div className="loading">Loading integration status...</div>;
    }
    
    switch (status.status) {
      case 'connected':
        return (
          <div className="status-card connected">
            <div className="status-icon">✓</div>
            <div className="status-details">
              <h3>Connected to {crm.toUpperCase()}</h3>
              <p>Connected since: {formatDate(status.connected_at)}</p>
              <p>Token expires: {formatDate(status.expires_at)}</p>
              <div className="status-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => disconnectFromCRM(crm)}
                >
                  Disconnect
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => syncData(crm, crm === 'close' ? 'leads' : 'contacts')}
                >
                  Sync Contacts/Leads
                </button>
                {crm !== 'close' && (
                  <button 
                    className="btn-primary"
                    onClick={() => syncData(crm, crm === 'ghl' ? 'opportunities' : 'deals')}
                  >
                    Sync Deals
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'token_expired':
        return (
          <div className="status-card expired">
            <div className="status-icon">!</div>
            <div className="status-details">
              <h3>Connection Expired</h3>
              <p>Your connection to {crm.toUpperCase()} has expired.</p>
              <button 
                className="btn-primary"
                onClick={() => connectToCRM(crm)}
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
              <h3>Disconnected from {crm.toUpperCase()}</h3>
              <p>Your app is currently disconnected from {crm.toUpperCase()}.</p>
              <button 
                className="btn-primary"
                onClick={() => connectToCRM(crm)}
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
              <h3>Not Connected to {crm.toUpperCase()}</h3>
              <p>Connect to {crm.toUpperCase()} to sync your contacts, leads, and deals.</p>
              <button 
                className="btn-primary"
                onClick={() => connectToCRM(crm)}
              >
                Connect
              </button>
            </div>
          </div>
        );
    }
  };

  // Render sync history
  const renderSyncHistory = () => {
    if (syncStatus.length === 0) {
      return (
        <div className="card">
          <div className="card-body">
            <p>No sync history available. Connect to a CRM and sync data to see history here.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">Sync History</div>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Entity Type</th>
                <th>Status</th>
                <th>Results</th>
              </tr>
            </thead>
            <tbody>
              {syncStatus.map(sync => (
                <tr key={sync.id}>
                  <td>{formatDate(sync.created_at)}</td>
                  <td>{sync.source.toUpperCase()}</td>
                  <td>{sync.entity_type}</td>
                  <td>
                    <span className={`status-badge ${sync.status}`}>
                      {sync.status}
                    </span>
                  </td>
                  <td>
                    {sync.results ? (
                      <span>
                        {sync.results.total} total, {sync.results.created} created, {sync.results.updated} updated
                      </span>
                    ) : (
                      sync.status === 'in_progress' ? 'Processing...' : 'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    if (loading) {
      return <div className="loading">Loading integration data...</div>;
    }
    
    if (error) {
      return <div className="error">{error}</div>;
    }
    
    switch (activeTab) {
      case 'ghl':
        return (
          <div className="crm-tab">
            <div className="crm-logo ghl-logo">
              <span>Go High Level</span>
            </div>
            
            {renderConnectionStatus('ghl')}
            
            <div className="card">
              <div className="card-header">
                <div className="card-title">About Go High Level Integration</div>
              </div>
              <div className="card-body">
                <p>Integrating with Go High Level allows you to:</p>
                <ul className="feature-list">
                  <li>Sync contacts and opportunities from GHL to EzerAI</li>
                  <li>Use AI sales training with your GHL contacts</li>
                  <li>Apply lead predictability to your GHL pipeline</li>
                  <li>Track engagement across your GHL marketing campaigns</li>
                </ul>
                <p>The integration uses OAuth for secure authentication without storing your GHL credentials.</p>
              </div>
            </div>
          </div>
        );
      
      case 'close':
        return (
          <div className="crm-tab">
            <div className="crm-logo close-logo">
              <span>Close</span>
            </div>
            
            {renderConnectionStatus('close')}
            
            <div className="card">
              <div className="card-header">
                <div className="card-title">About Close Integration</div>
              </div>
              <div className="card-body">
                <p>Integrating with Close allows you to:</p>
                <ul className="feature-list">
                  <li>Sync leads and contacts from Close to EzerAI</li>
                  <li>Use AI sales training with your Close leads</li>
                  <li>Apply lead predictability to your Close pipeline</li>
                  <li>Track engagement across your Close communications</li>
                </ul>
                <p>The integration uses OAuth for secure authentication without storing your Close credentials.</p>
              </div>
            </div>
          </div>
        );
      
      case 'hubspot':
        return (
          <div className="crm-tab">
            <div className="crm-logo hubspot-logo">
              <span>HubSpot</span>
            </div>
            
            {renderConnectionStatus('hubspot')}
            
            <div className="card">
              <div className="card-header">
                <div className="card-title">About HubSpot Integration</div>
              </div>
              <div className="card-body">
                <p>Integrating with HubSpot allows you to:</p>
                <ul className="feature-list">
                  <li>Sync contacts and deals from HubSpot to EzerAI</li>
                  <li>Use AI sales training with your HubSpot contacts</li>
                  <li>Apply lead predictability to your HubSpot pipeline</li>
                  <li>Track engagement across your HubSpot marketing campaigns</li>
                </ul>
                <p>The integration uses OAuth for secure authentication without storing your HubSpot credentials.</p>
              </div>
            </div>
          </div>
        );
      
      case 'sync':
        return (
          <div className="sync-tab">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Data Synchronization</div>
              </div>
              <div className="card-body">
                <p>Sync your CRM data with EzerAI to enable AI sales training and lead predictability features.</p>
                <p>Connected CRMs:</p>
                <div className="connected-crms">
                  {integrationStatus.ghl.status === 'connected' && (
                    <div className="connected-crm">
                      <span className="crm-name">Go High Level</span>
                      <div className="sync-buttons">
                        <button 
                          className="btn-primary"
                          onClick={() => syncData('ghl', 'contacts')}
                        >
                          Sync Contacts
                        </button>
                        <button 
                          className="btn-primary"
                          onClick={() => syncData('ghl', 'opportunities')}
                        >
                          Sync Opportunities
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {integrationStatus.close.status === 'connected' && (
                    <div className="connected-crm">
                      <span className="crm-name">Close</span>
                      <div className="sync-buttons">
                        <button 
                          className="btn-primary"
                          onClick={() => syncData('close', 'leads')}
                        >
                          Sync Leads
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {integrationStatus.hubspot.status === 'connected' && (
                    <div className="connected-crm">
                      <span className="crm-name">HubSpot</span>
                      <div className="sync-buttons">
                        <button 
                          className="btn-primary"
                          onClick={() => syncData('hubspot', 'contacts')}
                        >
                          Sync Contacts
                        </button>
                        <button 
                          className="btn-primary"
                          onClick={() => syncData('hubspot', 'deals')}
                        >
                          Sync Deals
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {integrationStatus.ghl.status !== 'connected' && 
                   integrationStatus.close.status !== 'connected' && 
                   integrationStatus.hubspot.status !== 'connected' && (
                    <p>No CRMs connected. Connect to a CRM to enable data synchronization.</p>
                  )}
                </div>
              </div>
            </div>
            
            {renderSyncHistory()}
          </div>
        );
      
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="module-container crm-integration-module">
      <div className="module-header">
        <h2 className="module-title">CRM Integrations</h2>
        <p className="module-description">Connect your CRM to enable AI sales training and lead predictability features</p>
      </div>
      
      <div className="module-tabs">
        <div 
          className={`tab ${activeTab === 'ghl' ? 'active' : ''}`}
          onClick={() => setActiveTab('ghl')}
        >
          Go High Level
        </div>
        <div 
          className={`tab ${activeTab === 'close' ? 'active' : ''}`}
          onClick={() => setActiveTab('close')}
        >
          Close
        </div>
        <div 
          className={`tab ${activeTab === 'hubspot' ? 'active' : ''}`}
          onClick={() => setActiveTab('hubspot')}
        >
          HubSpot
        </div>
        <div 
          className={`tab ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          Data Sync
        </div>
      </div>
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CRMIntegration;
