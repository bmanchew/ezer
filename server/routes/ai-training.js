const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const aiTrainingController = require('../controllers/aiTrainingController');

// @route   GET api/ai-training/modules
// @desc    Get all training modules
// @access  Private
router.get('/modules', auth, aiTrainingController.getModules);

// @route   GET api/ai-training/modules/:id
// @desc    Get training module by ID
// @access  Private
router.get('/modules/:id', auth, aiTrainingController.getModuleById);

// @route   GET api/ai-training/progress
// @desc    Get user's training progress
// @access  Private
router.get('/progress', auth, aiTrainingController.getUserProgress);

// @route   POST api/ai-training/progress/:moduleId
// @desc    Update user's progress on a training module
// @access  Private
router.post('/progress/:moduleId', [
  auth,
  check('progress', 'Progress is required').isInt({ min: 0, max: 100 })
], aiTrainingController.updateProgress);

// @route   GET api/ai-training/metrics
// @desc    Get user's performance metrics
// @access  Private
router.get('/metrics', auth, aiTrainingController.getPerformanceMetrics);

// @route   GET api/ai-training/insights
// @desc    Get AI insights for the user
// @access  Private
router.get('/insights', auth, aiTrainingController.getInsights);

// @route   PUT api/ai-training/insights/:id/read
// @desc    Mark an insight as read
// @access  Private
router.put('/insights/:id/read', auth, aiTrainingController.markInsightAsRead);

// @route   GET api/ai-training/coaching
// @desc    Get user's coaching sessions
// @access  Private
router.get('/coaching', auth, aiTrainingController.getCoachingSessions);

// @route   POST api/ai-training/coaching
// @desc    Schedule a new coaching session
// @access  Private
router.post('/coaching', [
  auth,
  check('title', 'Title is required').not().isEmpty(),
  check('scheduled_at', 'Scheduled time is required').isISO8601(),
  check('duration', 'Duration is required').isInt({ min: 15 })
], aiTrainingController.scheduleCoachingSession);

// @route   PUT api/ai-training/coaching/:id
// @desc    Update a coaching session
// @access  Private
router.put('/coaching/:id', [
  auth,
  check('status', 'Status is required').isIn(['scheduled', 'completed', 'cancelled'])
], aiTrainingController.updateCoachingSession);

// @route   GET api/ai-training/recommendations
// @desc    Get AI coaching recommendations
// @access  Private
router.get('/recommendations', auth, aiTrainingController.getRecommendations);

module.exports = router;
