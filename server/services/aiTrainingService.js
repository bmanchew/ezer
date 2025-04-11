const { 
  TrainingModule, 
  UserTrainingProgress, 
  PerformanceMetric, 
  AiInsight, 
  CoachingSession,
  User,
  Activity
} = require('../models');
const { Op, Sequelize } = require('sequelize');

// Service for AI Training Module
const aiTrainingService = {
  // Generate AI insights based on user performance
  generateInsights: async (userId) => {
    try {
      // Get user's performance metrics
      const metrics = await PerformanceMetric.findAll({
        where: { user_id: userId },
        order: [['date', 'DESC']],
        limit: 30
      });
      
      // Get user's activities
      const activities = await Activity.findAll({
        where: { 
          user_id: userId,
          created_at: {
            [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });
      
      // Get team averages
      const teamMetrics = await PerformanceMetric.findAll({
        attributes: [
          'metric_type',
          [Sequelize.fn('AVG', Sequelize.col('metric_value')), 'avgValue']
        ],
        group: ['metric_type']
      });
      
      // Generate insights based on data analysis
      const insights = [];
      
      // Example insight generation logic
      // 1. Check call pickup rate compared to team average
      const userPickupRate = metrics.find(m => m.metric_type === 'pickup_rate')?.metric_value || 0;
      const teamAvgPickupRate = teamMetrics.find(m => m.metric_type === 'pickup_rate')?.dataValues.avgValue || 0;
      
      if (userPickupRate < teamAvgPickupRate * 0.8) {
        insights.push({
          user_id: userId,
          insight_type: 'performance',
          insight_text: `Your pickup rate (${userPickupRate.toFixed(1)}%) is below team average (${teamAvgPickupRate.toFixed(1)}%). Try calling at different times or reviewing your opening script.`,
          priority: 'high',
          is_read: false
        });
      } else if (userPickupRate > teamAvgPickupRate * 1.2) {
        insights.push({
          user_id: userId,
          insight_type: 'performance',
          insight_text: `Great job! Your pickup rate (${userPickupRate.toFixed(1)}%) is above team average (${teamAvgPickupRate.toFixed(1)}%). Keep up the good work!`,
          priority: 'low',
          is_read: false
        });
      }
      
      // 2. Check call volume
      const callCount = activities.filter(a => a.type === 'call').length;
      const avgCallsPerDay = callCount / 30;
      
      if (avgCallsPerDay < 10) {
        insights.push({
          user_id: userId,
          insight_type: 'activity',
          insight_text: `Your average call volume (${avgCallsPerDay.toFixed(1)} calls/day) is low. Aim for at least 20 calls per day for better results.`,
          priority: 'medium',
          is_read: false
        });
      }
      
      // 3. Check training progress
      const trainingProgress = await UserTrainingProgress.findAll({
        where: { user_id: userId },
        include: [{ model: TrainingModule }]
      });
      
      const incompleteTrainings = trainingProgress.filter(tp => !tp.completed);
      if (incompleteTrainings.length > 0) {
        insights.push({
          user_id: userId,
          insight_type: 'training',
          insight_text: `You have ${incompleteTrainings.length} incomplete training modules. Complete "${incompleteTrainings[0].TrainingModule.title}" to improve your skills.`,
          priority: 'medium',
          is_read: false
        });
      }
      
      // Save generated insights to database
      if (insights.length > 0) {
        await AiInsight.bulkCreate(insights);
      }
      
      return insights;
    } catch (err) {
      console.error('Error generating insights:', err);
      throw err;
    }
  },
  
  // Calculate and store performance metrics for a user
  calculatePerformanceMetrics: async (userId) => {
    try {
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      // Get user's activities
      const activities = await Activity.findAll({
        where: { 
          user_id: userId,
          created_at: {
            [Op.between]: [startDate, today]
          }
        }
      });
      
      // Calculate metrics
      const metrics = [];
      
      // 1. Call metrics
      const calls = activities.filter(a => a.type === 'call');
      const completedCalls = calls.filter(a => a.status === 'completed');
      
      const pickupRate = calls.length > 0 ? (completedCalls.length / calls.length) * 100 : 0;
      metrics.push({
        user_id: userId,
        metric_type: 'pickup_rate',
        metric_value: pickupRate,
        date: today
      });
      
      const avgCallDuration = completedCalls.length > 0 
        ? completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / completedCalls.length 
        : 0;
      metrics.push({
        user_id: userId,
        metric_type: 'avg_call_duration',
        metric_value: avgCallDuration,
        date: today
      });
      
      // 2. Email metrics
      const emails = activities.filter(a => a.type === 'email');
      metrics.push({
        user_id: userId,
        metric_type: 'email_count',
        metric_value: emails.length,
        date: today
      });
      
      // 3. Appointment metrics
      const appointments = activities.filter(a => a.type === 'appointment');
      const completedAppointments = appointments.filter(a => a.status === 'completed');
      
      const appointmentShowRate = appointments.length > 0 
        ? (completedAppointments.length / appointments.length) * 100 
        : 0;
      metrics.push({
        user_id: userId,
        metric_type: 'appointment_show_rate',
        metric_value: appointmentShowRate,
        date: today
      });
      
      // Save metrics to database
      await PerformanceMetric.bulkCreate(metrics);
      
      return metrics;
    } catch (err) {
      console.error('Error calculating performance metrics:', err);
      throw err;
    }
  },
  
  // Generate personalized training recommendations for a user
  generateTrainingRecommendations: async (userId) => {
    try {
      // Get user's performance metrics
      const metrics = await PerformanceMetric.findAll({
        where: { user_id: userId },
        order: [['date', 'DESC']],
        limit: 30
      });
      
      // Get user's completed training modules
      const completedTrainings = await UserTrainingProgress.findAll({
        where: { 
          user_id: userId,
          completed: true
        },
        include: [{ model: TrainingModule }]
      });
      
      // Get all available training modules
      const allModules = await TrainingModule.findAll();
      
      // Find modules the user hasn't completed
      const completedModuleIds = completedTrainings.map(ct => ct.module_id);
      const incompleteModules = allModules.filter(module => !completedModuleIds.includes(module.id));
      
      // Prioritize modules based on user's performance metrics
      const prioritizedModules = incompleteModules.map(module => {
        let priority = 0;
        
        // Example prioritization logic
        // If pickup rate is low, prioritize call-related training
        const pickupRateMetric = metrics.find(m => m.metric_type === 'pickup_rate');
        if (pickupRateMetric && pickupRateMetric.metric_value < 30 && module.title.toLowerCase().includes('call')) {
          priority += 3;
        }
        
        // If appointment show rate is low, prioritize appointment-related training
        const appointmentShowRateMetric = metrics.find(m => m.metric_type === 'appointment_show_rate');
        if (appointmentShowRateMetric && appointmentShowRateMetric.metric_value < 50 && module.title.toLowerCase().includes('appointment')) {
          priority += 2;
        }
        
        return {
          module,
          priority
        };
      });
      
      // Sort by priority (highest first)
      prioritizedModules.sort((a, b) => b.priority - a.priority);
      
      // Return top 3 recommended modules
      return prioritizedModules.slice(0, 3).map(pm => pm.module);
    } catch (err) {
      console.error('Error generating training recommendations:', err);
      throw err;
    }
  },
  
  // Generate coaching recommendations based on user performance
  generateCoachingRecommendations: async (userId) => {
    try {
      // Get user's performance metrics
      const metrics = await PerformanceMetric.findAll({
        where: { user_id: userId },
        order: [['date', 'DESC']],
        limit: 30
      });
      
      // Get team averages
      const teamMetrics = await PerformanceMetric.findAll({
        attributes: [
          'metric_type',
          [Sequelize.fn('AVG', Sequelize.col('metric_value')), 'avgValue']
        ],
        group: ['metric_type']
      });
      
      // Generate coaching recommendations
      const recommendations = [];
      
      // Example recommendation logic
      // 1. Check call pickup rate compared to team average
      const userPickupRate = metrics.find(m => m.metric_type === 'pickup_rate')?.metric_value || 0;
      const teamAvgPickupRate = teamMetrics.find(m => m.metric_type === 'pickup_rate')?.dataValues.avgValue || 0;
      
      if (userPickupRate < teamAvgPickupRate * 0.8) {
        recommendations.push({
          type: 'coaching',
          text: 'Schedule a coaching session focused on improving your call opening techniques',
          priority: 'high'
        });
      }
      
      // 2. Check appointment show rate
      const appointmentShowRate = metrics.find(m => m.metric_type === 'appointment_show_rate')?.metric_value || 0;
      if (appointmentShowRate < 50) {
        recommendations.push({
          type: 'coaching',
          text: 'Work with your manager on improving your appointment setting process',
          priority: 'medium'
        });
      }
      
      // 3. Check call duration
      const avgCallDuration = metrics.find(m => m.metric_type === 'avg_call_duration')?.metric_value || 0;
      if (avgCallDuration < 120) { // Less than 2 minutes
        recommendations.push({
          type: 'coaching',
          text: 'Your calls are shorter than optimal. Schedule a coaching session on keeping prospects engaged',
          priority: 'medium'
        });
      }
      
      return recommendations;
    } catch (err) {
      console.error('Error generating coaching recommendations:', err);
      throw err;
    }
  },
  
  // Create sample training modules for testing
  createSampleTrainingModules: async () => {
    try {
      const modules = [
        {
          title: 'Cold Calling 101',
          description: 'Learn the fundamentals of effective cold calling',
          content: JSON.stringify({
            sections: [
              {
                title: 'Introduction to Cold Calling',
                content: 'Cold calling is the process of contacting potential customers who have not expressed interest in your products or services.'
              },
              {
                title: 'Preparing for Cold Calls',
                content: 'Research your prospect, prepare your script, and set clear objectives for the call.'
              },
              {
                title: 'Handling Objections',
                content: 'Learn how to address common objections and keep the conversation moving forward.'
              }
            ],
            quizzes: [
              {
                question: 'What is the primary goal of a cold call?',
                options: [
                  'To make a sale immediately',
                  'To set an appointment or next step',
                  'To introduce yourself',
                  'To qualify the prospect'
                ],
                correctAnswer: 1
              }
            ]
          }),
          difficulty: 'beginner',
          duration: 60
        },
        {
          title: 'Objection Handling Masterclass',
          description: 'Advanced techniques for handling sales objections',
          content: JSON.stringify({
            sections: [
              {
                title: 'Understanding Objections',
                content: 'Objections are often requests for more information, not rejections.'
              },
              {
                title: 'The LAER Framework',
                content: 'Listen, Acknowledge, Explore, Respond - a proven framework for handling objections.'
              },
              {
                title: 'Price Objections',
                content: 'Specific strategies for addressing concerns about price and demonstrating value.'
              }
            ],
            quizzes: [
              {
                question: 'What does the "E" in LAER stand for?',
                options: [
                  'Explain',
                  'Engage',
                  'Explore',
                  'Emphasize'
                ],
                correctAnswer: 2
              }
            ]
          }),
          difficulty: 'advanced',
          duration: 90
        },
        {
          title: 'Effective Follow-up Strategies',
          description: 'Learn how to follow up effectively to increase conversion rates',
          content: JSON.stringify({
            sections: [
              {
                title: 'The Importance of Follow-up',
                content: '80% of sales require at least 5 follow-ups, yet most salespeople give up after just 2.'
              },
              {
                title: 'Creating a Follow-up Schedule',
                content: 'Develop a systematic approach to follow-up with specific timing and methods.'
              },
              {
                title: 'Multi-channel Follow-up',
                content: 'Leverage email, phone, social media, and other channels for maximum effectiveness.'
              }
            ],
            quizzes: [
              {
                question: 'How many follow-ups does the average sale require?',
                options: [
                  '1-2',
                  '3-4',
                  '5+',
                  'It varies too much to say'
                ],
                correctAnswer: 2
              }
            ]
          }),
          difficulty: 'intermediate',
          duration: 75
        }
      ];
      
      // Create modules in database
      for (const module of modules) {
        await TrainingModule.findOrCreate({
          where: { title: module.title },
          defaults: module
        });
      }
      
      return await TrainingModule.findAll();
    } catch (err) {
      console.error('Error creating sample training modules:', err);
      throw err;
    }
  }
};

module.exports = aiTrainingService;
