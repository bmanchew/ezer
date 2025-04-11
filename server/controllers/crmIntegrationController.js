const axios = require('axios');
const querystring = require('querystring');
const { validationResult } = require('express-validator');
const { 
  GHLIntegration, 
  CloseIntegration, 
  HubspotIntegration,
  SyncLog,
  User 
} = require('../models');

// CRM API configurations - would be replaced with actual API endpoints
const GHL_API_BASE_URL = process.env.GHL_API_BASE_URL || 'https://api.gohighlevel.com';
const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID || 'mock_ghl_client_id';
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET || 'mock_ghl_client_secret';
const GHL_REDIRECT_URI = process.env.GHL_REDIRECT_URI || 'http://localhost:5000/api/crm/ghl/callback';

const CLOSE_API_BASE_URL = process.env.CLOSE_API_BASE_URL || 'https://api.close.com';
const CLOSE_CLIENT_ID = process.env.CLOSE_CLIENT_ID || 'mock_close_client_id';
const CLOSE_CLIENT_SECRET = process.env.CLOSE_CLIENT_SECRET || 'mock_close_client_secret';
const CLOSE_REDIRECT_URI = process.env.CLOSE_REDIRECT_URI || 'http://localhost:5000/api/crm/close/callback';

const HUBSPOT_API_BASE_URL = process.env.HUBSPOT_API_BASE_URL || 'https://api.hubapi.com';
const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID || 'mock_hubspot_client_id';
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET || 'mock_hubspot_client_secret';
const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:5000/api/crm/hubspot/callback';

// Controller for CRM Integrations
const crmIntegrationController = {
  // GHL Integration
  getGHLAuthUrl: async (req, res) => {
    try {
      const authUrl = `${GHL_API_BASE_URL}/oauth/authorize?` + 
        querystring.stringify({
          client_id: GHL_CLIENT_ID,
          redirect_uri: GHL_REDIRECT_URI,
          response_type: 'code',
          scope: 'contacts/read contacts/write opportunities/read opportunities/write',
          state: req.user.id // Use user ID as state for security
        });
      
      res.json({ authUrl });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  handleGHLCallback: async (req, res) => {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ msg: 'Invalid callback parameters' });
    }
    
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(`${GHL_API_BASE_URL}/oauth/token`, {
        client_id: GHL_CLIENT_ID,
        client_secret: GHL_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: GHL_REDIRECT_URI
      });
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Get user ID from state
      const userId = state;
      
      // Save integration data
      const [integration, created] = await GHLIntegration.findOrCreate({
        where: { user_id: userId },
        defaults: {
          access_token,
          refresh_token,
          expires_at: new Date(Date.now() + expires_in * 1000),
          status: 'connected'
        }
      });
      
      if (!created) {
        // Update existing integration
        integration.access_token = access_token;
        integration.refresh_token = refresh_token;
        integration.expires_at = new Date(Date.now() + expires_in * 1000);
        integration.status = 'connected';
        await integration.save();
      }
      
      // Redirect to frontend with success message
      res.redirect('/settings/integrations?status=success&provider=ghl');
    } catch (err) {
      console.error('Error in GHL OAuth callback:', err);
      res.redirect('/settings/integrations?status=error&provider=ghl');
    }
  },

  getGHLStatus: async (req, res) => {
    try {
      const integration = await GHLIntegration.findOne({
        where: { user_id: req.user.id }
      });
      
      if (!integration) {
        return res.json({ status: 'not_connected' });
      }
      
      // Check if token is expired
      if (integration.expires_at < new Date()) {
        // Token is expired, try to refresh
        try {
          const refreshResponse = await axios.post(`${GHL_API_BASE_URL}/oauth/token`, {
            client_id: GHL_CLIENT_ID,
            client_secret: GHL_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: integration.refresh_token
          });
          
          const { access_token, refresh_token, expires_in } = refreshResponse.data;
          
          // Update integration with new tokens
          integration.access_token = access_token;
          integration.refresh_token = refresh_token;
          integration.expires_at = new Date(Date.now() + expires_in * 1000);
          await integration.save();
          
          return res.json({
            status: 'connected',
            expires_at: integration.expires_at,
            connected_at: integration.updated_at
          });
        } catch (err) {
          console.error('Error refreshing GHL token:', err);
          
          // Mark as disconnected if refresh fails
          integration.status = 'disconnected';
          await integration.save();
          
          return res.json({ status: 'token_expired' });
        }
      }
      
      // Token is valid
      res.json({
        status: integration.status,
        expires_at: integration.expires_at,
        connected_at: integration.updated_at
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  disconnectGHL: async (req, res) => {
    try {
      const integration = await GHLIntegration.findOne({
        where: { user_id: req.user.id }
      });
      
      if (!integration) {
        return res.status(404).json({ msg: 'Integration not found' });
      }
      
      // Revoke token at GHL
      try {
        await axios.post(`${GHL_API_BASE_URL}/oauth/revoke`, {
          client_id: GHL_CLIENT_ID,
          client_secret: GHL_CLIENT_SECRET,
          token: integration.access_token
        });
      } catch (err) {
        console.error('Error revoking GHL token:', err);
        // Continue with local disconnection even if remote revocation fails
      }
      
      // Update local status
      integration.status = 'disconnected';
      await integration.save();
      
      res.json({ msg: 'Successfully disconnected from GHL' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  getGHLContacts: async (req, res) => {
    try {
      const integration = await GHLIntegration.findOne({
        where: { user_id: req.user.id, status: 'connected' }
      });
      
      if (!integration) {
        return res.status(401).json({ msg: 'GHL integration not connected' });
      }
      
      // Get contacts from GHL
      const response = await axios.get(`${GHL_API_BASE_URL}/v1/contacts`, {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`
        },
        params: {
          limit: req.query.limit || 100,
          page: req.query.page || 1
        }
      });
      
      res.json(response.data);
    } catch (err) {
      console.error('Error getting GHL contacts:', err);
      res.status(500).send('Server Error');
    }
  },

  // Close Integration
  getCloseAuthUrl: async (req, res) => {
    try {
      const authUrl = `${CLOSE_API_BASE_URL}/oauth2/authorize?` + 
        querystring.stringify({
          client_id: CLOSE_CLIENT_ID,
          redirect_uri: CLOSE_REDIRECT_URI,
          response_type: 'code',
          scope: 'leads:read leads:write contacts:read contacts:write',
          state: req.user.id // Use user ID as state for security
        });
      
      res.json({ authUrl });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  handleCloseCallback: async (req, res) => {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ msg: 'Invalid callback parameters' });
    }
    
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(`${CLOSE_API_BASE_URL}/oauth2/token`, 
        querystring.stringify({
          client_id: CLOSE_CLIENT_ID,
          client_secret: CLOSE_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: CLOSE_REDIRECT_URI
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Get user ID from state
      const userId = state;
      
      // Save integration data
      const [integration, created] = await CloseIntegration.findOrCreate({
        where: { user_id: userId },
        defaults: {
          access_token,
          refresh_token,
          expires_at: new Date(Date.now() + expires_in * 1000),
          status: 'connected'
        }
      });
      
      if (!created) {
        // Update existing integration
        integration.access_token = access_token;
        integration.refresh_token = refresh_token;
        integration.expires_at = new Date(Date.now() + expires_in * 1000);
        integration.status = 'connected';
        await integration.save();
      }
      
      // Redirect to frontend with success message
      res.redirect('/settings/integrations?status=success&provider=close');
    } catch (err) {
      console.error('Error in Close OAuth callback:', err);
      res.redirect('/settings/integrations?status=error&provider=close');
    }
  },

  getCloseStatus: async (req, res) => {
    try {
      const integration = await CloseIntegration.findOne({
        where: { user_id: req.user.id }
      });
      
      if (!integration) {
        return res.json({ status: 'not_connected' });
      }
      
      // Check if token is expired
      if (integration.expires_at < new Date()) {
        // Token is expired, try to refresh
        try {
          const refreshResponse = await axios.post(`${CLOSE_API_BASE_URL}/oauth2/token`, 
            querystring.stringify({
              client_id: CLOSE_CLIENT_ID,
              client_secret: CLOSE_CLIENT_SECRET,
              grant_type: 'refresh_token',
              refresh_token: integration.refresh_token
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
          
          const { access_token, refresh_token, expires_in } = refreshResponse.data;
          
          // Update integration with new tokens
          integration.access_token = access_token;
          integration.refresh_token = refresh_token;
          integration.expires_at = new Date(Date.now() + expires_in * 1000);
          await integration.save();
          
          return res.json({
            status: 'connected',
            expires_at: integration.expires_at,
            connected_at: integration.updated_at
          });
        } catch (err) {
          console.error('Error refreshing Close token:', err);
          
          // Mark as disconnected if refresh fails
          integration.status = 'disconnected';
          await integration.save();
          
          return res.json({ status: 'token_expired' });
        }
      }
      
      // Token is valid
      res.json({
        status: integration.status,
        expires_at: integration.expires_at,
        connected_at: integration.updated_at
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  disconnectClose: async (req, res) => {
    try {
      const integration = await CloseIntegration.findOne({
        where: { user_id: req.user.id }
      });
      
      if (!integration) {
        return res.status(404).json({ msg: 'Integration not found' });
      }
      
      // Close doesn't have a token revocation endpoint, so we just update local status
      integration.status = 'disconnected';
      await integration.save();
      
      res.json({ msg: 'Successfully disconnected from Close' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  getCloseLeads: async (req, res) => {
    try {
      const integration = await CloseIntegration.findOne({
        where: { user_id: req.user.id, status: 'connected' }
      });
      
      if (!integration) {
        return res.status(401).json({ msg: 'Close integration not connected' });
      }
      
      // Get leads from Close
      const response = await axios.get(`${CLOSE_API_BASE_URL}/api/v1/lead`, {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`
        },
        params: {
          _limit: req.query.limit || 100,
          _skip: req.query.skip || 0
        }
      });
      
      res.json(response.data);
    } catch (err) {
      console.error('Error getting Close leads:', err);
      res.status(500).send('Server Error');
    }
  },

  // Hubspot Integration
  getHubspotAuthUrl: async (req, res) => {
    try {
      const authUrl = `${HUBSPOT_API_BASE_URL}/oauth/authorize?` + 
        querystring.stringify({
          client_id: HUBSPOT_CLIENT_ID,
          redirect_uri: HUBSPOT_REDIRECT_URI,
          response_type: 'code',
          scope: 'contacts crm.objects.contacts.read crm.objects.contacts.write',
          state: req.user.id // Use user ID as state for security
        });
      
      res.json({ authUrl });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  handleHubspotCallback: async (req, res) => {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ msg: 'Invalid callback parameters' });
    }
    
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(`${HUBSPOT_API_BASE_URL}/oauth/v1/token`, 
        querystring.stringify({
          client_id: HUBSPOT_CLIENT_ID,
          client_secret: HUBSPOT_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: HUBSPOT_REDIRECT_URI
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Get user ID from state
      const userId = state;
      
      // Save integration data
      const [integration, created] = await HubspotIntegration.findOrCreate({
        where: { user_id: userId },
        defaults: {
          access_token,
          refresh_token,
          expires_at: new Date(Date.now() + expires_in * 1000),
          status: 'connected'
        }
      });
      
      if (!created) {
        // Update existing integration
        integration.access_token = access_token;
        integration.refresh_token = refresh_token;
        integration.expires_at = new Date(Date.now() + expires_in * 1000);
        integration.status = 'connected';
        await integration.save();
      }
      
      // Redirect to frontend with success message
      res.redirect('/settings/integrations?status=success&provider=hubspot');
    } catch (err) {
      console.error('Error in Hubspot OAuth callback:', err);
      res.redirect('/settings/integrations?status=error&provider=hubspot');
    }
  },

  getHubspotStatus: async (req, res) => {
    try {
      const integration = await HubspotIntegration.findOne({
        where: { user_id: req.user.id }
      });
      
      if (!integration) {
        return res.json({ status: 'not_connected' });
      }
      
      // Check if token is expired
      if (integration.expires_at < new Date()) {
        // Token is expired, try to refresh
        try {
          const refreshResponse = await axios.post(`${HUBSPOT_API_BASE_URL}/oauth/v1/token`, 
            querystring.stringify({
              client_id: HUBSPOT_CLIENT_ID,
              client_secret: HUBSPOT_CLIENT_SECRET,
              grant_type: 'refresh_token',
              refresh_token: integration.refresh_token
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
          
          const { access_token, refresh_token, expires_in } = refreshResponse.data;
          
          // Update integration with new tokens
          integration.access_token = access_token;
          integration.refresh_token = refresh_token;
          integration.expires_at = new Date(Date.now() + expires_in * 1000);
          await integration.save();
          
          return res.json({
            status: 'connected',
            expires_at: integration.expires_at,
            connected_at: integration.updated_at
          });
        } catch (err) {
          console.error('Error refreshing Hubspot token:', err);
          
          // Mark as disconnected if refresh fails
          integration.status = 'disconnected';
          await integration.save();
          
          return res.json({ status: 'token_expired' });
        }
      }
      
      // Token is valid
      res.json({
        status: integration.status,
        expires_at: integration.expires_at,
        connected_at: integration.updated_at
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  disconnectHubspot: async (req, res) => {
    try {
      const integration = await HubspotIntegration.findOne({
        where: { user_id: req.user.id }
      });
      
      if (!integration) {
        return res.status(404).json({ msg: 'Integration not found' });
      }
      
      // Revoke token at Hubspot
      try {
        await axios.post(`${HUBSPOT_API_BASE_URL}/oauth/v1/token/revoke`, 
          querystring.stringify({
            token: integration.access_token
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${HUBSPOT_CLIENT_ID}:${HUBSPOT_CLIENT_SECRET}`).toString('base64')}`
            }
          }
        );
      } catch (err) {
        console.error('Error revoking Hubspot token:', err);
        // Continue with local disconnection even if remote revocation fails
      }
      
      // Update local status
      integration.status = 'disconnected';
      await integration.save();
      
      res.json({ msg: 'Successfully disconnected from Hubspot' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  getHubspotContacts: async (req, res) => {
    try {
      const integration = await HubspotIntegration.findOne({
        where: { user_id: req.user.id, status: 'connected' }
      });
      
      if (!integration) {
        return res.status(401).json({ msg: 'Hubspot integration not connected' });
      }
      
      // Get contacts from Hubspot
      const response = await axios.get(`${HUBSPOT_API_BASE_URL}/crm/v3/objects/contacts`, {
        headers: {
          'Authorization': `Bearer ${integration.access_token}`
        },
        params: {
          limit: req.query.limit || 100,
          after: req.query.after || undefined
        }
      });
      
      res.json(response.data);
    } catch (err) {
      console.error('Error getting Hubspot contacts:', err);
      res.status(500).send('Server Error');
    }
  },

  // Data Sync
  syncData: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { source, entity_type, options } = req.body;
    
    try {
      // Create sync log entry
      const syncLog = await SyncLog.create({
        user_id: req.user.id,
        source,
        entity_type,
        status: 'in_progress',
        options
      });
      
      // Start sync process (would be a background job in production)
      // For demo purposes, we'll just update the log status
      setTimeout(async () => {
        syncLog.status = 'completed';
        syncLog.results = {
          total_records: 100,
          created: 75,
          updated: 25,
          errors: 0
        };
        await syncLog.save();
      }, 5000);
      
      res.json({
        msg: 'Sync started',
        sync_id: syncLog.id
      });
    } catch (err) {
      console.error('Error starting sync:', err);
      res.status(500).send('Server Error');
    }
  },

  getSyncStatus: async (req, res) => {
    try {
      const syncLogs = await SyncLog.findAll({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
        limit: req.query.limit || 10
      });
      
      res.json(syncLogs);
    } catch (err) {
      console.error('Error getting sync status:', err);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = crmIntegrationController;
