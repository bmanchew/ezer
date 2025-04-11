const axios = require('axios');
const querystring = require('querystring');
const { validationResult } = require('express-validator');
const { ShifiIntegration, User } = require('../models');

// Mock ShiFi API configuration - would be replaced with actual ShiFi API endpoints
const SHIFI_API_BASE_URL = process.env.SHIFI_API_BASE_URL || 'https://api.shifi.example.com';
const SHIFI_CLIENT_ID = process.env.SHIFI_CLIENT_ID || 'mock_client_id';
const SHIFI_CLIENT_SECRET = process.env.SHIFI_CLIENT_SECRET || 'mock_client_secret';
const SHIFI_REDIRECT_URI = process.env.SHIFI_REDIRECT_URI || 'http://localhost:5000/api/shifi/callback';

// Controller for ShiFi Integration
const shifiIntegrationController = {
  // Get ShiFi OAuth URL
  getAuthUrl: async (req, res) => {
    try {
      const authUrl = `${SHIFI_API_BASE_URL}/oauth/authorize?` + 
        querystring.stringify({
          client_id: SHIFI_CLIENT_ID,
          redirect_uri: SHIFI_REDIRECT_URI,
          response_type: 'code',
          scope: 'voice_engine ai_model app_store',
          state: req.user.id // Use user ID as state for security
        });
      
      res.json({ authUrl });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Handle OAuth callback from ShiFi
  handleCallback: async (req, res) => {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ msg: 'Invalid callback parameters' });
    }
    
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(`${SHIFI_API_BASE_URL}/oauth/token`, {
        client_id: SHIFI_CLIENT_ID,
        client_secret: SHIFI_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: SHIFI_REDIRECT_URI
      });
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      // Get user ID from state
      const userId = state;
      
      // Save integration data
      const [integration, created] = await ShifiIntegration.findOrCreate({
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
      res.redirect('/settings/integrations?status=success&provider=shifi');
    } catch (err) {
      console.error('Error in ShiFi OAuth callback:', err);
      res.redirect('/settings/integrations?status=error&provider=shifi');
    }
  },

  // Check ShiFi integration status
  getStatus: async (req, res) => {
    try {
      const integration = await ShifiIntegration.findOne({
        where: { user_id: req.user.id }
      });
      
      if (!integration) {
        return res.json({ status: 'not_connected' });
      }
      
      // Check if token is expired
      if (integration.expires_at < new Date()) {
        // Token is expired, try to refresh
        try {
          const refreshResponse = await axios.post(`${SHIFI_API_BASE_URL}/oauth/token`, {
            client_id: SHIFI_CLIENT_ID,
            client_secret: SHIFI_CLIENT_SECRET,
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
          console.error('Error refreshing ShiFi token:', err);
          
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

  // Disconnect from ShiFi
  disconnect: async (req, res) => {
    try {
      const integration = await ShifiIntegration.findOne({
        where: { user_id: req.user.id }
      });
      
      if (!integration) {
        return res.status(404).json({ msg: 'Integration not found' });
      }
      
      // Revoke token at ShiFi
      try {
        await axios.post(`${SHIFI_API_BASE_URL}/oauth/revoke`, {
          client_id: SHIFI_CLIENT_ID,
          client_secret: SHIFI_CLIENT_SECRET,
          token: integration.access_token
        });
      } catch (err) {
        console.error('Error revoking ShiFi token:', err);
        // Continue with local disconnection even if remote revocation fails
      }
      
      // Update local status
      integration.status = 'disconnected';
      await integration.save();
      
      res.json({ msg: 'Successfully disconnected from ShiFi' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Transcribe audio using ShiFi's voice engine
  transcribeAudio: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { audio_url } = req.body;
    
    try {
      const integration = await ShifiIntegration.findOne({
        where: { user_id: req.user.id, status: 'connected' }
      });
      
      if (!integration) {
        return res.status(401).json({ msg: 'ShiFi integration not connected' });
      }
      
      // Call ShiFi voice engine API
      const response = await axios.post(
        `${SHIFI_API_BASE_URL}/voice/transcribe`,
        { audio_url },
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(response.data);
    } catch (err) {
      console.error('Error transcribing audio:', err);
      res.status(500).send('Server Error');
    }
  },

  // Synthesize speech using ShiFi's voice engine
  synthesizeSpeech: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { text, voice_id } = req.body;
    
    try {
      const integration = await ShifiIntegration.findOne({
        where: { user_id: req.user.id, status: 'connected' }
      });
      
      if (!integration) {
        return res.status(401).json({ msg: 'ShiFi integration not connected' });
      }
      
      // Call ShiFi voice engine API
      const response = await axios.post(
        `${SHIFI_API_BASE_URL}/voice/synthesize`,
        { 
          text,
          voice_id: voice_id || 'default'
        },
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(response.data);
    } catch (err) {
      console.error('Error synthesizing speech:', err);
      res.status(500).send('Server Error');
    }
  },

  // Analyze data using ShiFi's AI model
  analyzeData: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { data, analysis_type } = req.body;
    
    try {
      const integration = await ShifiIntegration.findOne({
        where: { user_id: req.user.id, status: 'connected' }
      });
      
      if (!integration) {
        return res.status(401).json({ msg: 'ShiFi integration not connected' });
      }
      
      // Call ShiFi AI model API
      const response = await axios.post(
        `${SHIFI_API_BASE_URL}/ai/analyze`,
        { 
          data,
          analysis_type
        },
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(response.data);
    } catch (err) {
      console.error('Error analyzing data:', err);
      res.status(500).send('Server Error');
    }
  },

  // Check app store listing status
  getAppStoreStatus: async (req, res) => {
    try {
      const integration = await ShifiIntegration.findOne({
        where: { user_id: req.user.id, status: 'connected' }
      });
      
      if (!integration) {
        return res.status(401).json({ msg: 'ShiFi integration not connected' });
      }
      
      // Call ShiFi app store API
      const response = await axios.get(
        `${SHIFI_API_BASE_URL}/app-store/apps/ezerai`,
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`
          }
        }
      );
      
      res.json(response.data);
    } catch (err) {
      console.error('Error checking app store status:', err);
      res.status(500).send('Server Error');
    }
  },

  // Update app store listing
  updateAppStoreListing: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { app_data } = req.body;
    
    try {
      const integration = await ShifiIntegration.findOne({
        where: { user_id: req.user.id, status: 'connected' }
      });
      
      if (!integration) {
        return res.status(401).json({ msg: 'ShiFi integration not connected' });
      }
      
      // Call ShiFi app store API
      const response = await axios.put(
        `${SHIFI_API_BASE_URL}/app-store/apps/ezerai`,
        app_data,
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(response.data);
    } catch (err) {
      console.error('Error updating app store listing:', err);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = shifiIntegrationController;
