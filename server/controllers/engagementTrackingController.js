const { validationResult } = require('express-validator');
const { 
  SMSEngagement, 
  AdEngagement, 
  FacebookAdEngagement, 
  WebsiteEngagement,
  TrackingPixel,
  Lead
} = require('../models');

// Controller for Engagement Tracking
const engagementTrackingController = {
  // SMS Tracking
  trackSMSClick: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { tracking_id, phone, message_id, campaign_id, metadata } = req.body;
    
    try {
      // Find lead by phone number
      let lead = await Lead.findOne({
        where: { phone }
      });
      
      // Create engagement record
      const engagement = await SMSEngagement.create({
        tracking_id,
        phone,
        message_id,
        campaign_id,
        lead_id: lead ? lead.id : null,
        metadata,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      // Return transparent 1x1 pixel
      res.set('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    } catch (err) {
      console.error('Error tracking SMS click:', err);
      // Still return pixel to avoid breaking tracking
      res.set('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    }
  },

  getSMSStats: async (req, res) => {
    try {
      // Get date range from query params or default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (req.query.days || 30));
      
      // Get SMS engagement stats
      const stats = await SMSEngagement.findAndCountAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        },
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'ASC']]
      });
      
      // Get campaign stats
      const campaignStats = await SMSEngagement.findAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id,
          campaign_id: {
            [Op.not]: null
          }
        },
        attributes: [
          'campaign_id',
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: ['campaign_id'],
        order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']],
        limit: 5
      });
      
      res.json({
        total: stats.count,
        daily: stats.rows,
        top_campaigns: campaignStats
      });
    } catch (err) {
      console.error('Error getting SMS stats:', err);
      res.status(500).send('Server Error');
    }
  },

  // Ad Click Tracking
  trackAdClick: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { tracking_id, source, campaign_id, ad_id, creative_id, metadata } = req.body;
    
    try {
      // Create engagement record
      const engagement = await AdEngagement.create({
        tracking_id,
        source,
        campaign_id,
        ad_id,
        creative_id,
        metadata,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      // Find tracking pixel
      const pixel = await TrackingPixel.findOne({
        where: { id: tracking_id }
      });
      
      // If pixel has a redirect URL, redirect the user
      if (pixel && pixel.redirect_url) {
        return res.redirect(pixel.redirect_url);
      }
      
      // Otherwise return transparent 1x1 pixel
      res.set('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    } catch (err) {
      console.error('Error tracking ad click:', err);
      // Still return pixel to avoid breaking tracking
      res.set('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    }
  },

  getAdStats: async (req, res) => {
    try {
      // Get date range from query params or default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (req.query.days || 30));
      
      // Get ad engagement stats
      const stats = await AdEngagement.findAndCountAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        },
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'ASC']]
      });
      
      // Get source stats
      const sourceStats = await AdEngagement.findAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        },
        attributes: [
          'source',
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: ['source'],
        order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']]
      });
      
      // Get campaign stats
      const campaignStats = await AdEngagement.findAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id,
          campaign_id: {
            [Op.not]: null
          }
        },
        attributes: [
          'campaign_id',
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: ['campaign_id'],
        order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']],
        limit: 5
      });
      
      res.json({
        total: stats.count,
        daily: stats.rows,
        by_source: sourceStats,
        top_campaigns: campaignStats
      });
    } catch (err) {
      console.error('Error getting ad stats:', err);
      res.status(500).send('Server Error');
    }
  },

  // Facebook Ad Tracking
  trackFacebookAd: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { tracking_id, ad_id, campaign_id, adset_id, creative_id, metadata } = req.body;
    
    try {
      // Create engagement record
      const engagement = await FacebookAdEngagement.create({
        tracking_id,
        ad_id,
        campaign_id,
        adset_id,
        creative_id,
        metadata,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      // Find tracking pixel
      const pixel = await TrackingPixel.findOne({
        where: { id: tracking_id }
      });
      
      // If pixel has a redirect URL, redirect the user
      if (pixel && pixel.redirect_url) {
        return res.redirect(pixel.redirect_url);
      }
      
      // Otherwise return transparent 1x1 pixel
      res.set('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    } catch (err) {
      console.error('Error tracking Facebook ad:', err);
      // Still return pixel to avoid breaking tracking
      res.set('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    }
  },

  getFacebookStats: async (req, res) => {
    try {
      // Get date range from query params or default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (req.query.days || 30));
      
      // Get Facebook ad engagement stats
      const stats = await FacebookAdEngagement.findAndCountAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        },
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'ASC']]
      });
      
      // Get campaign stats
      const campaignStats = await FacebookAdEngagement.findAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id,
          campaign_id: {
            [Op.not]: null
          }
        },
        attributes: [
          'campaign_id',
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: ['campaign_id'],
        order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']],
        limit: 5
      });
      
      // Get ad stats
      const adStats = await FacebookAdEngagement.findAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id,
          ad_id: {
            [Op.not]: null
          }
        },
        attributes: [
          'ad_id',
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: ['ad_id'],
        order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']],
        limit: 5
      });
      
      res.json({
        total: stats.count,
        daily: stats.rows,
        top_campaigns: campaignStats,
        top_ads: adStats
      });
    } catch (err) {
      console.error('Error getting Facebook stats:', err);
      res.status(500).send('Server Error');
    }
  },

  // Website Tracking
  trackWebsiteEngagement: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { tracking_id, page, action, session_id, visitor_id, time_on_page, metadata } = req.body;
    
    try {
      // Create engagement record
      const engagement = await WebsiteEngagement.create({
        tracking_id,
        page,
        action,
        session_id,
        visitor_id,
        time_on_page,
        metadata,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      });
      
      // Return transparent 1x1 pixel
      res.set('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    } catch (err) {
      console.error('Error tracking website engagement:', err);
      // Still return pixel to avoid breaking tracking
      res.set('Content-Type', 'image/gif');
      res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    }
  },

  getWebsiteStats: async (req, res) => {
    try {
      // Get date range from query params or default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (req.query.days || 30));
      
      // Get website engagement stats
      const stats = await WebsiteEngagement.findAndCountAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        },
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'ASC']]
      });
      
      // Get page stats
      const pageStats = await WebsiteEngagement.findAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        },
        attributes: [
          'page',
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: ['page'],
        order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']],
        limit: 10
      });
      
      // Get action stats
      const actionStats = await WebsiteEngagement.findAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        },
        attributes: [
          'action',
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: ['action'],
        order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']]
      });
      
      res.json({
        total: stats.count,
        daily: stats.rows,
        top_pages: pageStats,
        actions: actionStats
      });
    } catch (err) {
      console.error('Error getting website stats:', err);
      res.status(500).send('Server Error');
    }
  },

  // Tracking Pixel
  getTrackingPixel: async (req, res) => {
    const { id } = req.params;
    
    try {
      // Find tracking pixel
      const pixel = await TrackingPixel.findOne({
        where: { id }
      });
      
      if (!pixel) {
        return res.status(404).json({ msg: 'Tracking pixel not found' });
      }
      
      // Generate tracking script
      const script = `
        <script>
          (function() {
            var params = {
              tracking_id: '${pixel.id}',
              page: window.location.pathname,
              action: 'pageview',
              session_id: localStorage.getItem('ezerai_session_id') || Math.random().toString(36).substring(2),
              visitor_id: localStorage.getItem('ezerai_visitor_id') || Math.random().toString(36).substring(2),
              time_on_page: 0
            };
            
            // Store IDs in localStorage
            localStorage.setItem('ezerai_session_id', params.session_id);
            localStorage.setItem('ezerai_visitor_id', params.visitor_id);
            
            // Track pageview
            var img = new Image();
            img.src = '${process.env.API_URL || 'http://localhost:5000'}/api/engagement/website/track?' + 
              Object.keys(params).map(function(key) {
                return key + '=' + encodeURIComponent(params[key]);
              }).join('&');
            
            // Track time on page
            var startTime = new Date();
            window.addEventListener('beforeunload', function() {
              params.time_on_page = Math.round((new Date() - startTime) / 1000);
              params.action = 'exit';
              
              // Send beacon for more reliable tracking on page exit
              navigator.sendBeacon('${process.env.API_URL || 'http://localhost:5000'}/api/engagement/website/track', 
                JSON.stringify(params));
            });
            
            // Track clicks
            document.addEventListener('click', function(e) {
              var target = e.target;
              while (target && target.tagName !== 'A') {
                target = target.parentNode;
                if (!target) return;
              }
              
              params.action = 'click';
              params.metadata = {
                href: target.href,
                text: target.innerText,
                classes: target.className
              };
              
              var clickImg = new Image();
              clickImg.src = '${process.env.API_URL || 'http://localhost:5000'}/api/engagement/website/track?' + 
                Object.keys(params).map(function(key) {
                  return key + '=' + encodeURIComponent(typeof params[key] === 'object' ? 
                    JSON.stringify(params[key]) : params[key]);
                }).join('&');
            });
          })();
        </script>
      `;
      
      // Return script
      res.set('Content-Type', 'application/javascript');
      res.send(script);
    } catch (err) {
      console.error('Error getting tracking pixel:', err);
      res.status(500).send('Server Error');
    }
  },

  createTrackingPixel: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { type, name, redirect_url, metadata } = req.body;
    
    try {
      // Create tracking pixel
      const pixel = await TrackingPixel.create({
        user_id: req.user.id,
        type,
        name,
        redirect_url,
        metadata
      });
      
      // Generate installation code
      let installationCode;
      
      switch (type) {
        case 'website':
          installationCode = `<script src="${process.env.API_URL || 'http://localhost:5000'}/api/engagement/pixel/${pixel.id}"></script>`;
          break;
        case 'email':
        case 'sms':
          installationCode = `<img src="${process.env.API_URL || 'http://localhost:5000'}/api/engagement/sms/track?tracking_id=${pixel.id}&phone={{phone}}" width="1" height="1" />`;
          break;
        case 'ad':
          installationCode = `${process.env.API_URL || 'http://localhost:5000'}/api/engagement/ad/track?tracking_id=${pixel.id}&source={{source}}`;
          break;
        case 'facebook':
          installationCode = `${process.env.API_URL || 'http://localhost:5000'}/api/engagement/facebook/track?tracking_id=${pixel.id}&ad_id={{ad_id}}`;
          break;
        default:
          installationCode = `${process.env.API_URL || 'http://localhost:5000'}/api/engagement/pixel/${pixel.id}`;
      }
      
      res.json({
        pixel,
        installation_code: installationCode
      });
    } catch (err) {
      console.error('Error creating tracking pixel:', err);
      res.status(500).send('Server Error');
    }
  },

  // Engagement Summary
  getEngagementSummary: async (req, res) => {
    try {
      // Get date range from query params or default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (req.query.days || 30));
      
      // Get SMS engagement count
      const smsCount = await SMSEngagement.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        }
      });
      
      // Get ad engagement count
      const adCount = await AdEngagement.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        }
      });
      
      // Get Facebook ad engagement count
      const facebookCount = await FacebookAdEngagement.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        }
      });
      
      // Get website engagement count
      const websiteCount = await WebsiteEngagement.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: req.user.id
        }
      });
      
      // Get daily engagement counts
      const dailyEngagement = await sequelize.query(`
        SELECT 
          date_trunc('day', created_at) as date,
          COUNT(CASE WHEN "table" = 'sms_engagement' THEN 1 END) as sms,
          COUNT(CASE WHEN "table" = 'ad_engagement' THEN 1 END) as ad,
          COUNT(CASE WHEN "table" = 'facebook_ad_engagement' THEN 1 END) as facebook,
          COUNT(CASE WHEN "table" = 'website_engagement' THEN 1 END) as website
        FROM (
          SELECT created_at, 'sms_engagement' as "table" FROM sms_engagement WHERE user_id = :userId AND created_at BETWEEN :startDate AND :endDate
          UNION ALL
          SELECT created_at, 'ad_engagement' as "table" FROM ad_engagement WHERE user_id = :userId AND created_at BETWEEN :startDate AND :endDate
          UNION ALL
          SELECT created_at, 'facebook_ad_engagement' as "table" FROM facebook_ad_engagement WHERE user_id = :userId AND created_at BETWEEN :startDate AND :endDate
          UNION ALL
          SELECT created_at, 'website_engagement' as "table" FROM website_engagement WHERE user_id = :userId AND created_at BETWEEN :startDate AND :endDate
        ) as combined
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) ASC
      `, {
        replacements: { 
          userId: req.user.id,
          startDate,
          endDate
        },
        type: sequelize.QueryTypes.SELECT
      });
      
      res.json({
        total: {
          sms: smsCount,
          ad: adCount,
          facebook: facebookCount,
          website: websiteCount,
          all: smsCount + adCount + facebookCount + websiteCount
        },
        daily: dailyEngagement
      });
    } catch (err) {
      console.error('Error getting engagement summary:', err);
      res.status(500).send('Server Error');
    }
  },

  getLeadEngagementHistory: async (req, res) => {
    const { id } = req.params;
    
    try {
      // Find lead
      const lead = await Lead.findOne({
        where: { 
          id,
          user_id: req.user.id
        }
      });
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      // Get SMS engagements
      const smsEngagements = await SMSEngagement.findAll({
        where: {
          lead_id: id
        },
        order: [['created_at', 'DESC']],
        limit: 50
      });
      
      // Get website engagements by visitor ID if available
      let websiteEngagements = [];
      if (lead.metadata && lead.metadata.visitor_id) {
        websiteEngagements = await WebsiteEngagement.findAll({
          where: {
            visitor_id: lead.metadata.visitor_id
          },
          order: [['created_at', 'DESC']],
          limit: 50
        });
      }
      
      // Combine and sort all engagements
      const allEngagements = [
        ...smsEngagements.map(e => ({
          ...e.toJSON(),
          type: 'sms'
        })),
        ...websiteEngagements.map(e => ({
          ...e.toJSON(),
          type: 'website'
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      res.json({
        lead,
        engagements: allEngagements
      });
    } catch (err) {
      console.error('Error getting lead engagement history:', err);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = engagementTrackingController;
