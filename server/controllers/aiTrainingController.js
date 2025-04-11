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

// Controller for AI Training Module
const aiTrainingController = {
  // Get all training modules
  getModules: async (req, res) => {
    try {
      const modules = await TrainingModule.findAll({
        order: [['created_at', 'DESC']]
      });
      
      res.json(modules);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get training module by ID
  getModuleById: async (req, res) => {
    try {
      const module = await TrainingModule.findByPk(req.params.id);
      
      if (!module) {
        return res.status(404).json({ msg: 'Training module not found' });
      }
      
      res.json(module);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get user's training progress
  getUserProgress: async (req, res) => {
    try {
      const progress = await UserTrainingProgress.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: TrainingModule,
            attributes: ['id', 'title', 'description', 'difficulty', 'duration']
          }
        ]
      });
      
      res.json(progress);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update user's progress on a training module
  updateProgress: async (req, res) => {
    const { progress } = req.body;
    const completed = progress === 100;
    
    try {
      // Check if module exists
      const module = await TrainingModule.findByPk(req.params.moduleId);
      if (!module) {
        return res.status(404).json({ msg: 'Training module not found' });
      }
      
      // Find or create progress record
      let progressRecord = await UserTrainingProgress.findOne({
        where: {
          user_id: req.user.id,
          module_id: req.params.moduleId
        }
      });
      
      if (progressRecord) {
        // Update existing record
        progressRecord.progress = progress;
        if (completed && !progressRecord.completed) {
          progressRecord.completed = true;
          progressRecord.completed_at = new Date();
        }
        await progressRecord.save();
      } else {
        // Create new record
        progressRecord = await UserTrainingProgress.create({
          user_id: req.user.id,
          module_id: req.params.moduleId,
          progress,
          completed,
          completed_at: completed ? new Date() : null
        });
      }
      
      res.json(progressRecord);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get user's performance metrics
  getPerformanceMetrics: async (req, res) => {
    try {
      // Get date range from query params or default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (req.query.days || 30));
      
      const metrics = await PerformanceMetric.findAll({
        where: {
          user_id: req.user.id,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['date', 'ASC']]
      });
      
      // Get call metrics
      const callMetrics = await Activity.findAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalCalls'],
          [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'answeredCalls'],
          [Sequelize.fn('AVG', Sequelize.col('duration')), 'avgDuration']
        ],
        where: {
          user_id: req.user.id,
          type: 'call',
          created_at: {
            [Op.between]: [startDate, endDate]
          }
        }
      });
      
      // Calculate team averages for comparison
      const teamMetrics = await PerformanceMetric.findAll({
        attributes: [
          'metric_type',
          [Sequelize.fn('AVG', Sequelize.col('metric_value')), 'avgValue']
        ],
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['metric_type']
      });
      
      // Get top performer metrics
      const topPerformerMetrics = await PerformanceMetric.findAll({
        attributes: [
          'metric_type',
          [Sequelize.fn('MAX', Sequelize.col('metric_value')), 'maxValue']
        ],
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        group: ['metric_type']
      });
      
      res.json({
        userMetrics: metrics,
        callMetrics: callMetrics[0],
        teamAverages: teamMetrics,
        topPerformerMetrics: topPerformerMetrics
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get AI insights for the user
  getInsights: async (req, res) => {
    try {
      const insights = await AiInsight.findAll({
        where: { user_id: req.user.id },
        order: [
          ['priority', 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: req.query.limit ? parseInt(req.query.limit) : 10
      });
      
      res.json(insights);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Mark an insight as read
  markInsightAsRead: async (req, res) => {
    try {
      const insight = await AiInsight.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });
      
      if (!insight) {
        return res.status(404).json({ msg: 'Insight not found' });
      }
      
      insight.is_read = true;
      await insight.save();
      
      res.json(insight);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get user's coaching sessions
  getCoachingSessions: async (req, res) => {
    try {
      const sessions = await CoachingSession.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            model: User,
            as: 'Coach',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [['scheduled_at', 'ASC']]
      });
      
      res.json(sessions);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Schedule a new coaching session
  scheduleCoachingSession: async (req, res) => {
    const { title, description, scheduled_at, duration, coach_id } = req.body;
    
    try {
      // If coach_id is provided, verify the coach exists
      if (coach_id) {
        const coach = await User.findOne({
          where: {
            id: coach_id,
            role: {
              [Op.in]: ['admin', 'manager']
            }
          }
        });
        
        if (!coach) {
          return res.status(404).json({ msg: 'Coach not found' });
        }
      }
      
      const session = await CoachingSession.create({
        user_id: req.user.id,
        coach_id,
        title,
        description,
        scheduled_at,
        duration,
        status: 'scheduled'
      });
      
      res.json(session);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a coaching session
  updateCoachingSession: async (req, res) => {
    const { status, notes } = req.body;
    
    try {
      const session = await CoachingSession.findOne({
        where: {
          id: req.params.id,
          user_id: req.user.id
        }
      });
      
      if (!session) {
        return res.status(404).json({ msg: 'Coaching session not found' });
      }
      
      session.status = status;
      if (notes) session.notes = notes;
      await session.save();
      
      res.json(session);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get AI coaching recommendations
  getRecommendations: async (req, res) => {
    try {
      // This would typically involve complex AI logic to generate recommendations
      // For the MVP, we'll return mock recommendations based on user's performance
      
      // Get user's performance metrics
      const metrics = await PerformanceMetric.findAll({
        where: { user_id: req.user.id },
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
      
      // Mock recommendations based on metrics
      const recommendations = [
        {
          id: 1,
          type: 'training',
          text: 'Based on your call metrics, we recommend completing the "Objection Handling Masterclass" module',
          priority: 'high'
        },
        {
          id: 2,
          type: 'coaching',
          text: 'Schedule a coaching session focused on improving your follow-up strategy',
          priority: 'medium'
        },
        {
          id: 3,
          type: 'practice',
          text: 'Practice your pitch with the top performer in your team',
          priority: 'medium'
        },
        {
          id: 4,
          type: 'schedule',
          text: 'Your best call times are between 10-11 AM. Try to schedule more calls during this time',
          priority: 'low'
        }
      ];
      
      res.json(recommendations);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = aiTrainingController;
