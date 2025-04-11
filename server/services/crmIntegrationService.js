const axios = require('axios');
const { 
  GHLIntegration, 
  CloseIntegration, 
  HubspotIntegration,
  Lead,
  Contact,
  Deal,
  Activity,
  SyncLog
} = require('../models');

// Service for CRM Integrations
const crmIntegrationService = {
  // GHL Integration Services
  getGHLClient: async (userId) => {
    try {
      const integration = await GHLIntegration.findOne({
        where: { user_id: userId, status: 'connected' }
      });
      
      if (!integration) {
        throw new Error('GHL integration not connected');
      }
      
      // Check if token is expired
      if (integration.expires_at < new Date()) {
        // Token is expired, try to refresh
        const refreshed = await crmIntegrationService.refreshGHLToken(integration);
        if (!refreshed) {
          throw new Error('Failed to refresh GHL token');
        }
      }
      
      // Create axios instance with auth header
      const client = axios.create({
        baseURL: process.env.GHL_API_BASE_URL || 'https://api.gohighlevel.com',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return client;
    } catch (err) {
      console.error('Error getting GHL client:', err);
      throw err;
    }
  },
  
  refreshGHLToken: async (integration) => {
    try {
      const GHL_API_BASE_URL = process.env.GHL_API_BASE_URL || 'https://api.gohighlevel.com';
      const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID || 'mock_ghl_client_id';
      const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET || 'mock_ghl_client_secret';
      
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
      
      return true;
    } catch (err) {
      console.error('Error refreshing GHL token:', err);
      
      // Mark as disconnected if refresh fails
      integration.status = 'disconnected';
      await integration.save();
      
      return false;
    }
  },
  
  getGHLContacts: async (userId, params = {}) => {
    try {
      const client = await crmIntegrationService.getGHLClient(userId);
      
      const response = await client.get('/v1/contacts', {
        params: {
          limit: params.limit || 100,
          page: params.page || 1,
          query: params.query || undefined
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error getting GHL contacts:', err);
      throw err;
    }
  },
  
  getGHLOpportunities: async (userId, params = {}) => {
    try {
      const client = await crmIntegrationService.getGHLClient(userId);
      
      const response = await client.get('/v1/opportunities', {
        params: {
          limit: params.limit || 100,
          page: params.page || 1,
          status: params.status || undefined
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error getting GHL opportunities:', err);
      throw err;
    }
  },
  
  syncGHLContacts: async (userId) => {
    try {
      // Create sync log
      const syncLog = await SyncLog.create({
        user_id: userId,
        source: 'ghl',
        entity_type: 'contacts',
        status: 'in_progress'
      });
      
      let page = 1;
      let hasMore = true;
      let created = 0;
      let updated = 0;
      let errors = 0;
      let total = 0;
      
      try {
        while (hasMore) {
          const contactsData = await crmIntegrationService.getGHLContacts(userId, { page, limit: 100 });
          
          if (!contactsData.contacts || contactsData.contacts.length === 0) {
            hasMore = false;
            continue;
          }
          
          total += contactsData.contacts.length;
          
          // Process each contact
          for (const contactData of contactsData.contacts) {
            try {
              // Map GHL contact to our schema
              const contactInfo = {
                external_id: contactData.id,
                source: 'ghl',
                first_name: contactData.firstName,
                last_name: contactData.lastName,
                email: contactData.email,
                phone: contactData.phone,
                company: contactData.companyName,
                job_title: contactData.jobTitle,
                status: contactData.status || 'new',
                tags: contactData.tags,
                metadata: {
                  ghl_data: contactData
                }
              };
              
              // Find or create contact
              const [contact, isNew] = await Contact.findOrCreate({
                where: {
                  external_id: contactData.id,
                  source: 'ghl'
                },
                defaults: contactInfo
              });
              
              if (isNew) {
                created++;
              } else {
                // Update existing contact
                await contact.update(contactInfo);
                updated++;
              }
              
              // Create lead if it doesn't exist
              const [lead, leadCreated] = await Lead.findOrCreate({
                where: {
                  email: contactData.email
                },
                defaults: {
                  first_name: contactData.firstName,
                  last_name: contactData.lastName,
                  email: contactData.email,
                  phone: contactData.phone,
                  company: contactData.companyName,
                  job_title: contactData.jobTitle,
                  source: 'ghl',
                  status: contactData.status || 'new'
                }
              });
              
              // Link contact to lead
              if (leadCreated || contact.lead_id !== lead.id) {
                contact.lead_id = lead.id;
                await contact.save();
              }
            } catch (err) {
              console.error(`Error processing GHL contact ${contactData.id}:`, err);
              errors++;
            }
          }
          
          page++;
          
          // Check if there are more pages
          hasMore = contactsData.contacts.length === 100;
        }
        
        // Update sync log
        syncLog.status = 'completed';
        syncLog.results = {
          total,
          created,
          updated,
          errors
        };
        await syncLog.save();
        
        return {
          success: true,
          sync_id: syncLog.id,
          results: {
            total,
            created,
            updated,
            errors
          }
        };
      } catch (err) {
        console.error('Error in GHL contacts sync:', err);
        
        // Update sync log with error
        syncLog.status = 'failed';
        syncLog.error = err.message;
        await syncLog.save();
        
        throw err;
      }
    } catch (err) {
      console.error('Error starting GHL contacts sync:', err);
      throw err;
    }
  },
  
  syncGHLOpportunities: async (userId) => {
    try {
      // Create sync log
      const syncLog = await SyncLog.create({
        user_id: userId,
        source: 'ghl',
        entity_type: 'opportunities',
        status: 'in_progress'
      });
      
      let page = 1;
      let hasMore = true;
      let created = 0;
      let updated = 0;
      let errors = 0;
      let total = 0;
      
      try {
        while (hasMore) {
          const opportunitiesData = await crmIntegrationService.getGHLOpportunities(userId, { page, limit: 100 });
          
          if (!opportunitiesData.opportunities || opportunitiesData.opportunities.length === 0) {
            hasMore = false;
            continue;
          }
          
          total += opportunitiesData.opportunities.length;
          
          // Process each opportunity
          for (const oppData of opportunitiesData.opportunities) {
            try {
              // Find associated contact/lead
              let lead = null;
              
              if (oppData.contactId) {
                const contact = await Contact.findOne({
                  where: {
                    external_id: oppData.contactId,
                    source: 'ghl'
                  }
                });
                
                if (contact && contact.lead_id) {
                  lead = await Lead.findByPk(contact.lead_id);
                }
              }
              
              // Map GHL opportunity to our schema
              const dealInfo = {
                external_id: oppData.id,
                source: 'ghl',
                title: oppData.title,
                amount: oppData.value,
                stage: crmIntegrationService.mapGHLStageToInternal(oppData.status),
                lead_id: lead ? lead.id : null,
                close_date: oppData.closedDate ? new Date(oppData.closedDate) : null,
                metadata: {
                  ghl_data: oppData
                }
              };
              
              // Find or create deal
              const [deal, isNew] = await Deal.findOrCreate({
                where: {
                  external_id: oppData.id,
                  source: 'ghl'
                },
                defaults: dealInfo
              });
              
              if (isNew) {
                created++;
              } else {
                // Update existing deal
                await deal.update(dealInfo);
                updated++;
              }
            } catch (err) {
              console.error(`Error processing GHL opportunity ${oppData.id}:`, err);
              errors++;
            }
          }
          
          page++;
          
          // Check if there are more pages
          hasMore = opportunitiesData.opportunities.length === 100;
        }
        
        // Update sync log
        syncLog.status = 'completed';
        syncLog.results = {
          total,
          created,
          updated,
          errors
        };
        await syncLog.save();
        
        return {
          success: true,
          sync_id: syncLog.id,
          results: {
            total,
            created,
            updated,
            errors
          }
        };
      } catch (err) {
        console.error('Error in GHL opportunities sync:', err);
        
        // Update sync log with error
        syncLog.status = 'failed';
        syncLog.error = err.message;
        await syncLog.save();
        
        throw err;
      }
    } catch (err) {
      console.error('Error starting GHL opportunities sync:', err);
      throw err;
    }
  },
  
  mapGHLStageToInternal: (ghlStatus) => {
    // Map GHL opportunity status to internal deal stage
    const stageMap = {
      'new': 'set',
      'appointment_scheduled': 'shown',
      'qualified_to_buy': 'pitched',
      'presentation_scheduled': 'follow_up',
      'decision_maker_bought_in': 'follow_up',
      'contract_sent': 'follow_up',
      'closed_won': 'closed_won',
      'closed_lost': 'closed_lost'
    };
    
    return stageMap[ghlStatus.toLowerCase()] || 'set';
  },
  
  // Close Integration Services
  getCloseClient: async (userId) => {
    try {
      const integration = await CloseIntegration.findOne({
        where: { user_id: userId, status: 'connected' }
      });
      
      if (!integration) {
        throw new Error('Close integration not connected');
      }
      
      // Check if token is expired
      if (integration.expires_at < new Date()) {
        // Token is expired, try to refresh
        const refreshed = await crmIntegrationService.refreshCloseToken(integration);
        if (!refreshed) {
          throw new Error('Failed to refresh Close token');
        }
      }
      
      // Create axios instance with auth header
      const client = axios.create({
        baseURL: process.env.CLOSE_API_BASE_URL || 'https://api.close.com',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return client;
    } catch (err) {
      console.error('Error getting Close client:', err);
      throw err;
    }
  },
  
  refreshCloseToken: async (integration) => {
    try {
      const CLOSE_API_BASE_URL = process.env.CLOSE_API_BASE_URL || 'https://api.close.com';
      const CLOSE_CLIENT_ID = process.env.CLOSE_CLIENT_ID || 'mock_close_client_id';
      const CLOSE_CLIENT_SECRET = process.env.CLOSE_CLIENT_SECRET || 'mock_close_client_secret';
      
      const refreshResponse = await axios.post(`${CLOSE_API_BASE_URL}/oauth2/token`, 
        {
          client_id: CLOSE_CLIENT_ID,
          client_secret: CLOSE_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: integration.refresh_token
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const { access_token, refresh_token, expires_in } = refreshResponse.data;
      
      // Update integration with new tokens
      integration.access_token = access_token;
      integration.refresh_token = refresh_token;
      integration.expires_at = new Date(Date.now() + expires_in * 1000);
      await integration.save();
      
      return true;
    } catch (err) {
      console.error('Error refreshing Close token:', err);
      
      // Mark as disconnected if refresh fails
      integration.status = 'disconnected';
      await integration.save();
      
      return false;
    }
  },
  
  getCloseLeads: async (userId, params = {}) => {
    try {
      const client = await crmIntegrationService.getCloseClient(userId);
      
      const response = await client.get('/api/v1/lead', {
        params: {
          _limit: params.limit || 100,
          _skip: params.skip || 0,
          query: params.query || undefined
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error getting Close leads:', err);
      throw err;
    }
  },
  
  getCloseOpportunities: async (userId, params = {}) => {
    try {
      const client = await crmIntegrationService.getCloseClient(userId);
      
      const response = await client.get('/api/v1/opportunity', {
        params: {
          _limit: params.limit || 100,
          _skip: params.skip || 0,
          lead_id: params.lead_id || undefined
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error getting Close opportunities:', err);
      throw err;
    }
  },
  
  syncCloseLeads: async (userId) => {
    try {
      // Create sync log
      const syncLog = await SyncLog.create({
        user_id: userId,
        source: 'close',
        entity_type: 'leads',
        status: 'in_progress'
      });
      
      let skip = 0;
      let hasMore = true;
      let created = 0;
      let updated = 0;
      let errors = 0;
      let total = 0;
      
      try {
        while (hasMore) {
          const leadsData = await crmIntegrationService.getCloseLeads(userId, { skip, limit: 100 });
          
          if (!leadsData.data || leadsData.data.length === 0) {
            hasMore = false;
            continue;
          }
          
          total += leadsData.data.length;
          
          // Process each lead
          for (const leadData of leadsData.data) {
            try {
              // Extract contact info from lead
              const contactsInfo = [];
              
              if (leadData.contacts && leadData.contacts.length > 0) {
                for (const contactId of leadData.contacts) {
                  try {
                    const contactResponse = await client.get(`/api/v1/contact/${contactId}`);
                    contactsInfo.push(contactResponse.data);
                  } catch (err) {
                    console.error(`Error fetching Close contact ${contactId}:`, err);
                  }
                }
              }
              
              // Use first contact as primary if available
              const primaryContact = contactsInfo.length > 0 ? contactsInfo[0] : null;
              
              // Map Close lead to our schema
              const leadInfo = {
                external_id: leadData.id,
                source: 'close',
                first_name: primaryContact ? primaryContact.first_name : '',
                last_name: primaryContact ? primaryContact.last_name : '',
                email: primaryContact ? primaryContact.emails[0].email : '',
                phone: primaryContact ? (primaryContact.phones[0] ? primaryContact.phones[0].phone : '') : '',
                company: leadData.display_name,
                status: crmIntegrationService.mapCloseStatusToInternal(leadData.status_id),
                metadata: {
                  close_data: leadData
                }
              };
              
              // Find or create lead
              const [lead, isNew] = await Lead.findOrCreate({
                where: {
                  external_id: leadData.id,
                  source: 'close'
                },
                defaults: leadInfo
              });
              
              if (isNew) {
                created++;
              } else {
                // Update existing lead
                await lead.update(leadInfo);
                updated++;
              }
              
              // Process contacts
              for (const contactInfo of contactsInfo) {
                try {
                  const contactData = {
                    external_id: contactInfo.id,
                    source: 'close',
                    lead_id: lead.id,
                    first_name: contactInfo.first_name || '',
                    last_name: contactInfo.last_name || '',
                    email: contactInfo.emails.length > 0 ? contactInfo.emails[0].email : '',
                    phone: contactInfo.phones.length > 0 ? contactInfo.phones[0].phone : '',
                    job_title: contactInfo.title || '',
                    metadata: {
                      close_data: contactInfo
                    }
                  };
                  
                  // Find or create contact
                  const [contact, contactIsNew] = await Contact.findOrCreate({
                    where: {
                      external_id: contactInfo.id,
                      source: 'close'
                    },
                    defaults: contactData
                  });
                  
                  if (!contactIsNew) {
                    // Update existing contact
                    await contact.update(contactData);
                  }
                } catch (err) {
                  console.error(`Error processing Close contact ${contactInfo.id}:`, err);
                }
              }
            } catch (err) {
              console.error(`Error processing Close lead ${leadData.id}:`, err);
              errors++;
            }
          }
          
          skip += leadsData.data.length;
          
          // Check if there are more leads
          hasMore = leadsData.data.length === 100;
        }
        
        // Update sync log
        syncLog.status = 'completed';
        syncLog.results = {
          total,
          created,
          updated,
          errors
        };
        await syncLog.save();
        
        return {
          success: true,
          sync_id: syncLog.id,
          results: {
            total,
            created,
            updated,
            errors
          }
        };
      } catch (err) {
        console.error('Error in Close leads sync:', err);
        
        // Update sync log with error
        syncLog.status = 'failed';
        syncLog.error = err.message;
        await syncLog.save();
        
        throw err;
      }
    } catch (err) {
      console.error('Error starting Close leads sync:', err);
      throw err;
    }
  },
  
  mapCloseStatusToInternal: (closeStatusId) => {
    // Map Close lead status to internal lead status
    // This would need to be customized based on the user's Close setup
    const statusMap = {
      'stat_1': 'new',
      'stat_2': 'contacted',
      'stat_3': 'qualified',
      'stat_4': 'proposal',
      'stat_5': 'negotiation',
      'stat_6': 'won',
      'stat_7': 'lost'
    };
    
    return statusMap[closeStatusId] || 'new';
  },
  
  // Hubspot Integration Services
  getHubspotClient: async (userId) => {
    try {
      const integration = await HubspotIntegration.findOne({
        where: { user_id: userId, status: 'connected' }
      });
      
      if (!integration) {
        throw new Error('Hubspot integration not connected');
      }
      
      // Check if token is expired
      if (integration.expires_at < new Date()) {
        // Token is expired, try to refresh
        const refreshed = await crmIntegrationService.refreshHubspotToken(integration);
        if (!refreshed) {
          throw new Error('Failed to refresh Hubspot token');
        }
      }
      
      // Create axios instance with auth header
      const client = axios.create({
        baseURL: process.env.HUBSPOT_API_BASE_URL || 'https://api.hubapi.com',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return client;
    } catch (err) {
      console.error('Error getting Hubspot client:', err);
      throw err;
    }
  },
  
  refreshHubspotToken: async (integration) => {
    try {
      const HUBSPOT_API_BASE_URL = process.env.HUBSPOT_API_BASE_URL || 'https://api.hubapi.com';
      const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID || 'mock_hubspot_client_id';
      const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET || 'mock_hubspot_client_secret';
      
      const refreshResponse = await axios.post(`${HUBSPOT_API_BASE_URL}/oauth/v1/token`, 
        {
          grant_type: 'refresh_token',
          client_id: HUBSPOT_CLIENT_ID,
          client_secret: HUBSPOT_CLIENT_SECRET,
          refresh_token: integration.refresh_token
        },
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
      
      return true;
    } catch (err) {
      console.error('Error refreshing Hubspot token:', err);
      
      // Mark as disconnected if refresh fails
      integration.status = 'disconnected';
      await integration.save();
      
      return false;
    }
  },
  
  getHubspotContacts: async (userId, params = {}) => {
    try {
      const client = await crmIntegrationService.getHubspotClient(userId);
      
      const response = await client.get('/crm/v3/objects/contacts', {
        params: {
          limit: params.limit || 100,
          after: params.after || undefined,
          properties: 'firstname,lastname,email,phone,company,jobtitle'
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error getting Hubspot contacts:', err);
      throw err;
    }
  },
  
  getHubspotDeals: async (userId, params = {}) => {
    try {
      const client = await crmIntegrationService.getHubspotClient(userId);
      
      const response = await client.get('/crm/v3/objects/deals', {
        params: {
          limit: params.limit || 100,
          after: params.after || undefined,
          properties: 'dealname,amount,dealstage,closedate,pipeline'
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error getting Hubspot deals:', err);
      throw err;
    }
  },
  
  syncHubspotContacts: async (userId) => {
    try {
      // Create sync log
      const syncLog = await SyncLog.create({
        user_id: userId,
        source: 'hubspot',
        entity_type: 'contacts',
        status: 'in_progress'
      });
      
      let after = undefined;
      let hasMore = true;
      let created = 0;
      let updated = 0;
      let errors = 0;
      let total = 0;
      
      try {
        while (hasMore) {
          const contactsData = await crmIntegrationService.getHubspotContacts(userId, { after, limit: 100 });
          
          if (!contactsData.results || contactsData.results.length === 0) {
            hasMore = false;
            continue;
          }
          
          total += contactsData.results.length;
          
          // Process each contact
          for (const contactData of contactsData.results) {
            try {
              const props = contactData.properties;
              
              // Map Hubspot contact to our schema
              const contactInfo = {
                external_id: contactData.id,
                source: 'hubspot',
                first_name: props.firstname || '',
                last_name: props.lastname || '',
                email: props.email || '',
                phone: props.phone || '',
                company: props.company || '',
                job_title: props.jobtitle || '',
                metadata: {
                  hubspot_data: contactData
                }
              };
              
              // Find or create contact
              const [contact, isNew] = await Contact.findOrCreate({
                where: {
                  external_id: contactData.id,
                  source: 'hubspot'
                },
                defaults: contactInfo
              });
              
              if (isNew) {
                created++;
              } else {
                // Update existing contact
                await contact.update(contactInfo);
                updated++;
              }
              
              // Create lead if it doesn't exist and email is available
              if (props.email) {
                const [lead, leadCreated] = await Lead.findOrCreate({
                  where: {
                    email: props.email
                  },
                  defaults: {
                    first_name: props.firstname || '',
                    last_name: props.lastname || '',
                    email: props.email,
                    phone: props.phone || '',
                    company: props.company || '',
                    job_title: props.jobtitle || '',
                    source: 'hubspot',
                    status: 'new'
                  }
                });
                
                // Link contact to lead
                if (leadCreated || contact.lead_id !== lead.id) {
                  contact.lead_id = lead.id;
                  await contact.save();
                }
              }
            } catch (err) {
              console.error(`Error processing Hubspot contact ${contactData.id}:`, err);
              errors++;
            }
          }
          
          // Update after cursor for pagination
          after = contactsData.paging && contactsData.paging.next ? 
            contactsData.paging.next.after : undefined;
          
          // Check if there are more contacts
          hasMore = !!after;
        }
        
        // Update sync log
        syncLog.status = 'completed';
        syncLog.results = {
          total,
          created,
          updated,
          errors
        };
        await syncLog.save();
        
        return {
          success: true,
          sync_id: syncLog.id,
          results: {
            total,
            created,
            updated,
            errors
          }
        };
      } catch (err) {
        console.error('Error in Hubspot contacts sync:', err);
        
        // Update sync log with error
        syncLog.status = 'failed';
        syncLog.error = err.message;
        await syncLog.save();
        
        throw err;
      }
    } catch (err) {
      console.error('Error starting Hubspot contacts sync:', err);
      throw err;
    }
  }
};

module.exports = crmIntegrationService;
