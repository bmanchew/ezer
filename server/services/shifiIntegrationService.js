const axios = require('axios');
const { ShifiIntegration } = require('../models');

// Service for ShiFi Integration
const shifiIntegrationService = {
  // Get ShiFi client with valid access token
  getShifiClient: async (userId) => {
    try {
      const integration = await ShifiIntegration.findOne({
        where: { user_id: userId, status: 'connected' }
      });
      
      if (!integration) {
        throw new Error('ShiFi integration not connected');
      }
      
      // Check if token is expired
      if (integration.expires_at < new Date()) {
        // Token is expired, try to refresh
        const refreshed = await shifiIntegrationService.refreshToken(integration);
        if (!refreshed) {
          throw new Error('Failed to refresh ShiFi token');
        }
      }
      
      // Create axios instance with auth header
      const client = axios.create({
        baseURL: process.env.SHIFI_API_BASE_URL || 'https://api.shifi.example.com',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return client;
    } catch (err) {
      console.error('Error getting ShiFi client:', err);
      throw err;
    }
  },
  
  // Refresh access token
  refreshToken: async (integration) => {
    try {
      const SHIFI_API_BASE_URL = process.env.SHIFI_API_BASE_URL || 'https://api.shifi.example.com';
      const SHIFI_CLIENT_ID = process.env.SHIFI_CLIENT_ID || 'mock_client_id';
      const SHIFI_CLIENT_SECRET = process.env.SHIFI_CLIENT_SECRET || 'mock_client_secret';
      
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
      
      return true;
    } catch (err) {
      console.error('Error refreshing ShiFi token:', err);
      
      // Mark as disconnected if refresh fails
      integration.status = 'disconnected';
      await integration.save();
      
      return false;
    }
  },
  
  // Transcribe audio using ShiFi's voice engine
  transcribeAudio: async (userId, audioUrl) => {
    try {
      const client = await shifiIntegrationService.getShifiClient(userId);
      
      const response = await client.post('/voice/transcribe', { audio_url: audioUrl });
      
      return response.data;
    } catch (err) {
      console.error('Error transcribing audio:', err);
      throw err;
    }
  },
  
  // Synthesize speech using ShiFi's voice engine
  synthesizeSpeech: async (userId, text, voiceId = 'default') => {
    try {
      const client = await shifiIntegrationService.getShifiClient(userId);
      
      const response = await client.post('/voice/synthesize', { 
        text,
        voice_id: voiceId
      });
      
      return response.data;
    } catch (err) {
      console.error('Error synthesizing speech:', err);
      throw err;
    }
  },
  
  // Analyze data using ShiFi's AI model
  analyzeData: async (userId, data, analysisType) => {
    try {
      const client = await shifiIntegrationService.getShifiClient(userId);
      
      const response = await client.post('/ai/analyze', { 
        data,
        analysis_type: analysisType
      });
      
      return response.data;
    } catch (err) {
      console.error('Error analyzing data:', err);
      throw err;
    }
  },
  
  // Get available voice models
  getVoiceModels: async (userId) => {
    try {
      const client = await shifiIntegrationService.getShifiClient(userId);
      
      const response = await client.get('/voice/models');
      
      return response.data;
    } catch (err) {
      console.error('Error getting voice models:', err);
      throw err;
    }
  },
  
  // Get available AI models
  getAIModels: async (userId) => {
    try {
      const client = await shifiIntegrationService.getShifiClient(userId);
      
      const response = await client.get('/ai/models');
      
      return response.data;
    } catch (err) {
      console.error('Error getting AI models:', err);
      throw err;
    }
  },
  
  // Update app store listing
  updateAppStoreListing: async (userId, appData) => {
    try {
      const client = await shifiIntegrationService.getShifiClient(userId);
      
      const response = await client.put('/app-store/apps/ezerai', appData);
      
      return response.data;
    } catch (err) {
      console.error('Error updating app store listing:', err);
      throw err;
    }
  },
  
  // Get app store analytics
  getAppStoreAnalytics: async (userId) => {
    try {
      const client = await shifiIntegrationService.getShifiClient(userId);
      
      const response = await client.get('/app-store/apps/ezerai/analytics');
      
      return response.data;
    } catch (err) {
      console.error('Error getting app store analytics:', err);
      throw err;
    }
  }
};

module.exports = shifiIntegrationService;
