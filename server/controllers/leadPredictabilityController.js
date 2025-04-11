const { 
  Lead, 
  LeadScoreHistory, 
  RevenuePrediction, 
  SalesConstraint,
  Activity,
  Deal
} = require('../models');
const { Op, Sequelize } = require('sequelize');

// Controller for Lead Predictability Module
const leadPredictabilityController = {
  // Get all lead scores
  getLeadScores: async (req, res) => {
    try {
      const leads = await Lead.findAll({
        attributes: ['id', 'first_name', 'last_name', 'email', 'company', 'source', 'status', 'ai_score', 'created_at'],
        order: [['ai_score', 'DESC']]
      });
      
      res.json(leads);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get score history for a specific lead
  getLeadScoreHistory: async (req, res) => {
    try {
      const scoreHistory = await LeadScoreHistory.findAll({
        where: { lead_id: req.params.leadId },
        order: [['created_at', 'DESC']]
      });
      
      res.json(scoreHistory);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Calculate score for a specific lead
  calculateLeadScore: async (req, res) => {
    try {
      // Find the lead
      const lead = await Lead.findByPk(req.params.leadId);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      // Get lead activities
      const activities = await Activity.findAll({
        where: { lead_id: req.params.leadId }
      });
      
      // Calculate score based on various factors
      let score = 0;
      const factors = {};
      
      // Factor 1: Source quality
      const sourceScores = {
        'referral': 25,
        'website': 20,
        'linkedin': 18,
        'facebook': 15,
        'google': 15,
        'cold_call': 10,
        'other': 5
      };
      
      const sourceScore = sourceScores[lead.source.toLowerCase()] || 5;
      score += sourceScore;
      factors.source = sourceScore;
      
      // Factor 2: Engagement level
      const engagementScore = Math.min(25, activities.length * 5);
      score += engagementScore;
      factors.engagement = engagementScore;
      
      // Factor 3: Recency of activity
      let recencyScore = 0;
      if (activities.length > 0) {
        const mostRecentActivity = activities.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0];
        
        const daysSinceLastActivity = Math.floor(
          (new Date() - new Date(mostRecentActivity.created_at)) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastActivity < 1) {
          recencyScore = 25;
        } else if (daysSinceLastActivity < 3) {
          recencyScore = 20;
        } else if (daysSinceLastActivity < 7) {
          recencyScore = 15;
        } else if (daysSinceLastActivity < 14) {
          recencyScore = 10;
        } else if (daysSinceLastActivity < 30) {
          recencyScore = 5;
        }
      }
      score += recencyScore;
      factors.recency = recencyScore;
      
      // Factor 4: Completeness of profile
      let completenessScore = 0;
      const profileFields = ['first_name', 'last_name', 'email', 'phone', 'company', 'job_title'];
      const filledFields = profileFields.filter(field => lead[field]);
      completenessScore = Math.floor((filledFields.length / profileFields.length) * 25);
      score += completenessScore;
      factors.completeness = completenessScore;
      
      // Save the score to the lead
      lead.ai_score = score;
      await lead.save();
      
      // Save score history
      const scoreHistory = await LeadScoreHistory.create({
        lead_id: lead.id,
        score,
        factors
      });
      
      res.json({
        lead,
        scoreHistory,
        factors
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get revenue predictions
  getRevenuePredictions: async (req, res) => {
    try {
      const predictions = await RevenuePrediction.findAll({
        order: [['prediction_date', 'ASC']]
      });
      
      res.json(predictions);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Generate new revenue prediction
  generateRevenuePrediction: async (req, res) => {
    try {
      // Get historical deal data
      const deals = await Deal.findAll({
        where: {
          close_date: {
            [Op.not]: null
          }
        },
        order: [['close_date', 'ASC']]
      });
      
      // Get current pipeline
      const pipeline = await Deal.findAll({
        where: {
          stage: {
            [Op.not]: ['closed_won', 'closed_lost']
          }
        }
      });
      
      // Calculate prediction for next month
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      // Simple prediction model based on historical data and pipeline
      let historicalAvg = 0;
      if (deals.length > 0) {
        const totalRevenue = deals.reduce((sum, deal) => sum + parseFloat(deal.amount), 0);
        historicalAvg = totalRevenue / deals.length;
      }
      
      // Weighted pipeline value
      const stageWeights = {
        'set': 0.2,
        'shown': 0.4,
        'pitched': 0.6,
        'follow_up': 0.8
      };
      
      let weightedPipeline = 0;
      pipeline.forEach(deal => {
        const weight = stageWeights[deal.stage] || 0.5;
        weightedPipeline += parseFloat(deal.amount) * weight;
      });
      
      // Combine historical and pipeline data
      const predictedAmount = historicalAvg * 0.3 + weightedPipeline * 0.7;
      
      // Add confidence interval (simple +/- 15%)
      const confidenceLow = predictedAmount * 0.85;
      const confidenceHigh = predictedAmount * 1.15;
      
      // Factors that influenced the prediction
      const factors = {
        historicalAverage: historicalAvg,
        pipelineValue: weightedPipeline,
        pipelineDeals: pipeline.length,
        historicalDeals: deals.length
      };
      
      // Save prediction
      const prediction = await RevenuePrediction.create({
        prediction_date: nextMonth,
        predicted_amount: predictedAmount,
        confidence_low: confidenceLow,
        confidence_high: confidenceHigh,
        factors
      });
      
      res.json(prediction);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get sales constraints
  getSalesConstraints: async (req, res) => {
    try {
      const constraints = await SalesConstraint.findAll({
        order: [
          ['status', 'ASC'],
          ['impact', 'DESC'],
          ['created_at', 'DESC']
        ]
      });
      
      res.json(constraints);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Add a new sales constraint
  addSalesConstraint: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { issue, impact, status, recommendation } = req.body;
    
    try {
      const constraint = await SalesConstraint.create({
        issue,
        impact,
        status,
        recommendation
      });
      
      res.json(constraint);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a sales constraint
  updateSalesConstraint: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { status, recommendation, resolution } = req.body;
    
    try {
      const constraint = await SalesConstraint.findByPk(req.params.id);
      
      if (!constraint) {
        return res.status(404).json({ msg: 'Constraint not found' });
      }
      
      constraint.status = status;
      if (recommendation) constraint.recommendation = recommendation;
      if (resolution) constraint.resolution = resolution;
      
      await constraint.save();
      
      res.json(constraint);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get engagement analytics
  getEngagementAnalytics: async (req, res) => {
    try {
      // Get date range from query params or default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (req.query.days || 30));
      
      // Get activities by type
      const activitiesByType = await Activity.findAll({
        attributes: [
          'type',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['type']
      });
      
      // Get activities by day
      const activitiesByDay = await Activity.findAll({
        attributes: [
          [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: [Sequelize.fn('DATE', Sequelize.col('created_at'))]
      });
      
      // Get top engaged leads
      const topEngagedLeads = await Activity.findAll({
        attributes: [
          'lead_id',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'activity_count']
        ],
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          },
          lead_id: {
            [Op.not]: null
          }
        },
        group: ['lead_id'],
        order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
        limit: 10,
        include: [
          {
            model: Lead,
            attributes: ['id', 'first_name', 'last_name', 'email', 'company', 'ai_score']
          }
        ]
      });
      
      res.json({
        activitiesByType,
        activitiesByDay,
        topEngagedLeads
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get conversion analytics
  getConversionAnalytics: async (req, res) => {
    try {
      // Get date range from query params or default to last 90 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (req.query.days || 90));
      
      // Get conversion rates by lead source
      const leadsBySource = await Lead.findAll({
        attributes: [
          'source',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
        ],
        where: {
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['source']
      });
      
      const dealsBySource = await Deal.findAll({
        attributes: [
          'Lead.source',
          [Sequelize.fn('COUNT', Sequelize.col('Deal.id')), 'won_deals'],
          [Sequelize.fn('SUM', Sequelize.col('Deal.amount')), 'total_revenue']
        ],
        include: [
          {
            model: Lead,
            attributes: []
          }
        ],
        where: {
          stage: 'closed_won',
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['Lead.source'],
        raw: true
      });
      
      // Calculate conversion rates
      const conversionRates = leadsBySource.map(source => {
        const matchingDeals = dealsBySource.find(deal => deal['Lead.source'] === source.source);
        return {
          source: source.source,
          total_leads: parseInt(source.total),
          won_deals: matchingDeals ? parseInt(matchingDeals.won_deals) : 0,
          total_revenue: matchingDeals ? parseFloat(matchingDeals.total_revenue) : 0,
          conversion_rate: matchingDeals 
            ? (parseInt(matchingDeals.won_deals) / parseInt(source.total) * 100).toFixed(2) 
            : 0
        };
      });
      
      // Get average time to close by source
      const avgTimeToClose = await Deal.findAll({
        attributes: [
          'Lead.source',
          [
            Sequelize.fn(
              'AVG', 
              Sequelize.fn(
                'DATEDIFF', 
                Sequelize.col('Deal.close_date'), 
                Sequelize.col('Lead.created_at')
              )
            ), 
            'avg_days_to_close'
          ]
        ],
        include: [
          {
            model: Lead,
            attributes: []
          }
        ],
        where: {
          stage: 'closed_won',
          close_date: {
            [Op.not]: null
          }
        },
        group: ['Lead.source'],
        raw: true
      });
      
      res.json({
        conversionRates,
        avgTimeToClose
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = leadPredictabilityController;
