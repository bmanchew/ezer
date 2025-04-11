const { 
  Lead, 
  LeadScoreHistory, 
  RevenuePrediction, 
  SalesConstraint,
  Activity,
  Deal
} = require('../models');
const { Op, Sequelize } = require('sequelize');

// Service for Lead Predictability Module
const leadPredictabilityService = {
  // Calculate lead score based on various factors
  calculateLeadScore: async (leadId) => {
    try {
      // Find the lead
      const lead = await Lead.findByPk(leadId);
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      // Get lead activities
      const activities = await Activity.findAll({
        where: { lead_id: leadId }
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
      
      return {
        lead,
        scoreHistory,
        factors
      };
    } catch (err) {
      console.error('Error calculating lead score:', err);
      throw err;
    }
  },
  
  // Generate revenue prediction for the next period
  generateRevenuePrediction: async () => {
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
      
      return prediction;
    } catch (err) {
      console.error('Error generating revenue prediction:', err);
      throw err;
    }
  },
  
  // Analyze sales constraints
  analyzeSalesConstraints: async () => {
    try {
      // Get activities
      const activities = await Activity.findAll({
        where: {
          created_at: {
            [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });
      
      // Get deals
      const deals = await Deal.findAll({
        where: {
          created_at: {
            [Op.gte]: new Date(new Date() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        }
      });
      
      // Identify potential constraints
      const constraints = [];
      
      // Check for low email open rates
      const emails = activities.filter(a => a.type === 'email');
      const openedEmails = emails.filter(a => a.status === 'completed');
      const emailOpenRate = emails.length > 0 ? (openedEmails.length / emails.length) * 100 : 0;
      
      if (emailOpenRate < 20 && emails.length > 10) {
        constraints.push({
          issue: 'Low email open rate',
          impact: 'high',
          status: 'active',
          recommendation: 'Revise email subject lines and test variations'
        });
      }
      
      // Check for high drop-off after demo
      const demos = deals.filter(d => d.stage === 'shown');
      const closedDeals = deals.filter(d => d.stage === 'closed_won');
      const demoConversionRate = demos.length > 0 ? (closedDeals.length / demos.length) * 100 : 0;
      
      if (demoConversionRate < 30 && demos.length > 5) {
        constraints.push({
          issue: 'High drop-off after demo',
          impact: 'high',
          status: 'active',
          recommendation: 'Review demo script and add more value propositions'
        });
      }
      
      // Check for slow follow-up time
      const followUpTimes = [];
      for (const activity of activities) {
        if (activity.type === 'call' && activity.status === 'completed') {
          // Find next follow-up
          const nextActivity = activities.find(a => 
            a.lead_id === activity.lead_id && 
            a.created_at > activity.created_at
          );
          
          if (nextActivity) {
            const followUpTime = new Date(nextActivity.created_at) - new Date(activity.created_at);
            followUpTimes.push(followUpTime / (1000 * 60 * 60)); // Hours
          }
        }
      }
      
      const avgFollowUpTime = followUpTimes.length > 0 
        ? followUpTimes.reduce((sum, time) => sum + time, 0) / followUpTimes.length 
        : 0;
      
      if (avgFollowUpTime > 48 && followUpTimes.length > 5) {
        constraints.push({
          issue: 'Slow follow-up time',
          impact: 'medium',
          status: 'active',
          recommendation: 'Implement automated initial response system'
        });
      }
      
      // Save new constraints
      for (const constraint of constraints) {
        // Check if constraint already exists
        const existingConstraint = await SalesConstraint.findOne({
          where: {
            issue: constraint.issue,
            status: {
              [Op.not]: 'resolved'
            }
          }
        });
        
        if (!existingConstraint) {
          await SalesConstraint.create(constraint);
        }
      }
      
      return await SalesConstraint.findAll({
        order: [
          ['status', 'ASC'],
          ['impact', 'DESC'],
          ['created_at', 'DESC']
        ]
      });
    } catch (err) {
      console.error('Error analyzing sales constraints:', err);
      throw err;
    }
  },
  
  // Generate sample leads for testing
  generateSampleLeads: async () => {
    try {
      const sampleLeads = [
        {
          source: 'Website',
          status: 'new',
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@example.com',
          phone: '555-123-4567',
          company: 'Acme Inc',
          job_title: 'Marketing Director'
        },
        {
          source: 'LinkedIn',
          status: 'contacted',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.johnson@example.com',
          phone: '555-234-5678',
          company: 'Tech Solutions',
          job_title: 'CEO'
        },
        {
          source: 'Referral',
          status: 'qualified',
          first_name: 'Michael',
          last_name: 'Brown',
          email: 'michael.brown@example.com',
          phone: '555-345-6789',
          company: 'Global Services',
          job_title: 'Sales Manager'
        },
        {
          source: 'Facebook',
          status: 'new',
          first_name: 'Emily',
          last_name: 'Davis',
          email: 'emily.davis@example.com',
          phone: '555-456-7890',
          company: 'Creative Design',
          job_title: 'Art Director'
        },
        {
          source: 'Cold Call',
          status: 'contacted',
          first_name: 'Robert',
          last_name: 'Wilson',
          email: 'robert.wilson@example.com',
          phone: '555-567-8901',
          company: 'Wilson Manufacturing',
          job_title: 'Operations Manager'
        }
      ];
      
      // Create leads in database
      const createdLeads = [];
      for (const leadData of sampleLeads) {
        const [lead, created] = await Lead.findOrCreate({
          where: { email: leadData.email },
          defaults: leadData
        });
        
        if (created) {
          createdLeads.push(lead);
          
          // Calculate score for the lead
          await this.calculateLeadScore(lead.id);
        }
      }
      
      return createdLeads;
    } catch (err) {
      console.error('Error generating sample leads:', err);
      throw err;
    }
  }
};

module.exports = leadPredictabilityService;
