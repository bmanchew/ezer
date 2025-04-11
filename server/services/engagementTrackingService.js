const { 
  SMSEngagement, 
  AdEngagement, 
  FacebookAdEngagement, 
  WebsiteEngagement,
  TrackingPixel,
  Lead,
  sequelize,
  Op
} = require('../models');

// Service for Engagement Tracking
const engagementTrackingService = {
  // Generate tracking pixel
  generateTrackingPixel: () => {
    // Return a 1x1 transparent GIF
    return Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  },
  
  // Generate tracking script for website
  generateTrackingScript: (pixelId, apiUrl = 'http://localhost:5000') => {
    return `
      <script>
        (function() {
          var params = {
            tracking_id: '${pixelId}',
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
          img.src = '${apiUrl}/api/engagement/website/track?' + 
            Object.keys(params).map(function(key) {
              return key + '=' + encodeURIComponent(params[key]);
            }).join('&');
          
          // Track time on page
          var startTime = new Date();
          window.addEventListener('beforeunload', function() {
            params.time_on_page = Math.round((new Date() - startTime) / 1000);
            params.action = 'exit';
            
            // Send beacon for more reliable tracking on page exit
            navigator.sendBeacon('${apiUrl}/api/engagement/website/track', 
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
            clickImg.src = '${apiUrl}/api/engagement/website/track?' + 
              Object.keys(params).map(function(key) {
                return key + '=' + encodeURIComponent(typeof params[key] === 'object' ? 
                  JSON.stringify(params[key]) : params[key]);
              }).join('&');
          });
        })();
      </script>
    `;
  },
  
  // Generate tracking URL for SMS
  generateSMSTrackingUrl: (pixelId, phone, apiUrl = 'http://localhost:5000') => {
    return `${apiUrl}/api/engagement/sms/track?tracking_id=${pixelId}&phone=${encodeURIComponent(phone)}`;
  },
  
  // Generate tracking URL for ads
  generateAdTrackingUrl: (pixelId, source, apiUrl = 'http://localhost:5000') => {
    return `${apiUrl}/api/engagement/ad/track?tracking_id=${pixelId}&source=${encodeURIComponent(source)}`;
  },
  
  // Generate tracking URL for Facebook ads
  generateFacebookTrackingUrl: (pixelId, adId, apiUrl = 'http://localhost:5000') => {
    return `${apiUrl}/api/engagement/facebook/track?tracking_id=${pixelId}&ad_id=${encodeURIComponent(adId)}`;
  },
  
  // Create tracking pixel
  createTrackingPixel: async (userId, type, name, redirectUrl = null, metadata = {}) => {
    try {
      const pixel = await TrackingPixel.create({
        user_id: userId,
        type,
        name,
        redirect_url: redirectUrl,
        metadata
      });
      
      return pixel;
    } catch (err) {
      console.error('Error creating tracking pixel:', err);
      throw err;
    }
  },
  
  // Track SMS click
  trackSMSClick: async (trackingId, phone, messageId = null, campaignId = null, metadata = {}, ipAddress = null, userAgent = null) => {
    try {
      // Find lead by phone number
      let lead = await Lead.findOne({
        where: { phone }
      });
      
      // Create engagement record
      const engagement = await SMSEngagement.create({
        tracking_id: trackingId,
        phone,
        message_id: messageId,
        campaign_id: campaignId,
        lead_id: lead ? lead.id : null,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      return engagement;
    } catch (err) {
      console.error('Error tracking SMS click:', err);
      throw err;
    }
  },
  
  // Track ad click
  trackAdClick: async (trackingId, source, campaignId = null, adId = null, creativeId = null, metadata = {}, ipAddress = null, userAgent = null) => {
    try {
      // Create engagement record
      const engagement = await AdEngagement.create({
        tracking_id: trackingId,
        source,
        campaign_id: campaignId,
        ad_id: adId,
        creative_id: creativeId,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      return engagement;
    } catch (err) {
      console.error('Error tracking ad click:', err);
      throw err;
    }
  },
  
  // Track Facebook ad
  trackFacebookAd: async (trackingId, adId, campaignId = null, adsetId = null, creativeId = null, metadata = {}, ipAddress = null, userAgent = null) => {
    try {
      // Create engagement record
      const engagement = await FacebookAdEngagement.create({
        tracking_id: trackingId,
        ad_id: adId,
        campaign_id: campaignId,
        adset_id: adsetId,
        creative_id: creativeId,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      return engagement;
    } catch (err) {
      console.error('Error tracking Facebook ad:', err);
      throw err;
    }
  },
  
  // Track website engagement
  trackWebsiteEngagement: async (trackingId, page, action, sessionId = null, visitorId = null, timeOnPage = null, metadata = {}, ipAddress = null, userAgent = null) => {
    try {
      // Create engagement record
      const engagement = await WebsiteEngagement.create({
        tracking_id: trackingId,
        page,
        action,
        session_id: sessionId,
        visitor_id: visitorId,
        time_on_page: timeOnPage,
        metadata,
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      return engagement;
    } catch (err) {
      console.error('Error tracking website engagement:', err);
      throw err;
    }
  },
  
  // Get SMS engagement stats
  getSMSEngagementStats: async (userId, days = 30) => {
    try {
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get SMS engagement stats
      const stats = await SMSEngagement.findAndCountAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: userId
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
          user_id: userId,
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
      
      return {
        total: stats.count,
        daily: stats.rows,
        top_campaigns: campaignStats
      };
    } catch (err) {
      console.error('Error getting SMS stats:', err);
      throw err;
    }
  },
  
  // Get ad engagement stats
  getAdEngagementStats: async (userId, days = 30) => {
    try {
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get ad engagement stats
      const stats = await AdEngagement.findAndCountAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: userId
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
          user_id: userId
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
          user_id: userId,
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
      
      return {
        total: stats.count,
        daily: stats.rows,
        by_source: sourceStats,
        top_campaigns: campaignStats
      };
    } catch (err) {
      console.error('Error getting ad stats:', err);
      throw err;
    }
  },
  
  // Get Facebook ad engagement stats
  getFacebookEngagementStats: async (userId, days = 30) => {
    try {
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get Facebook ad engagement stats
      const stats = await FacebookAdEngagement.findAndCountAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: userId
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
          user_id: userId,
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
          user_id: userId,
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
      
      return {
        total: stats.count,
        daily: stats.rows,
        top_campaigns: campaignStats,
        top_ads: adStats
      };
    } catch (err) {
      console.error('Error getting Facebook stats:', err);
      throw err;
    }
  },
  
  // Get website engagement stats
  getWebsiteEngagementStats: async (userId, days = 30) => {
    try {
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get website engagement stats
      const stats = await WebsiteEngagement.findAndCountAll({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: userId
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
          user_id: userId
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
          user_id: userId
        },
        attributes: [
          'action',
          [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        group: ['action'],
        order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']]
      });
      
      return {
        total: stats.count,
        daily: stats.rows,
        top_pages: pageStats,
        actions: actionStats
      };
    } catch (err) {
      console.error('Error getting website stats:', err);
      throw err;
    }
  },
  
  // Get engagement summary
  getEngagementSummary: async (userId, days = 30) => {
    try {
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get SMS engagement count
      const smsCount = await SMSEngagement.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: userId
        }
      });
      
      // Get ad engagement count
      const adCount = await AdEngagement.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: userId
        }
      });
      
      // Get Facebook ad engagement count
      const facebookCount = await FacebookAdEngagement.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: userId
        }
      });
      
      // Get website engagement count
      const websiteCount = await WebsiteEngagement.count({
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          user_id: userId
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
          userId,
          startDate,
          endDate
        },
        type: sequelize.QueryTypes.SELECT
      });
      
      return {
        total: {
          sms: smsCount,
          ad: adCount,
          facebook: facebookCount,
          website: websiteCount,
          all: smsCount + adCount + facebookCount + websiteCount
        },
        daily: dailyEngagement
      };
    } catch (err) {
      console.error('Error getting engagement summary:', err);
      throw err;
    }
  },
  
  // Get lead engagement history
  getLeadEngagementHistory: async (userId, leadId) => {
    try {
      // Find lead
      const lead = await Lead.findOne({
        where: { 
          id: leadId,
          user_id: userId
        }
      });
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      // Get SMS engagements
      const smsEngagements = await SMSEngagement.findAll({
        where: {
          lead_id: leadId
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
      
      return {
        lead,
        engagements: allEngagements
      };
    } catch (err) {
      console.error('Error getting lead engagement history:', err);
      throw err;
    }
  }
};

module.exports = engagementTrackingService;
