const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const leadPredictabilityController = require('../controllers/leadPredictabilityController');

// @route   GET api/lead-predictability/scores
// @desc    Get lead scores
// @access  Private
router.get('/scores', auth, leadPredictabilityController.getLeadScores);

// @route   GET api/lead-predictability/scores/:leadId
// @desc    Get score history for a specific lead
// @access  Private
router.get('/scores/:leadId', auth, leadPredictabilityController.getLeadScoreHistory);

// @route   POST api/lead-predictability/scores/:leadId
// @desc    Calculate score for a specific lead
// @access  Private
router.post('/scores/:leadId', auth, leadPredictabilityController.calculateLeadScore);

// @route   GET api/lead-predictability/predictions/revenue
// @desc    Get revenue predictions
// @access  Private
router.get('/predictions/revenue', auth, leadPredictabilityController.getRevenuePredictions);

// @route   POST api/lead-predictability/predictions/revenue
// @desc    Generate new revenue prediction
// @access  Private
router.post('/predictions/revenue', auth, leadPredictabilityController.generateRevenuePrediction);

// @route   GET api/lead-predictability/constraints
// @desc    Get sales constraints
// @access  Private
router.get('/constraints', auth, leadPredictabilityController.getSalesConstraints);

// @route   POST api/lead-predictability/constraints
// @desc    Add a new sales constraint
// @access  Private
router.post('/constraints', [
  auth,
  check('issue', 'Issue is required').not().isEmpty(),
  check('impact', 'Impact is required').isIn(['low', 'medium', 'high']),
  check('status', 'Status is required').isIn(['active', 'monitoring', 'resolved']),
], leadPredictabilityController.addSalesConstraint);

// @route   PUT api/lead-predictability/constraints/:id
// @desc    Update a sales constraint
// @access  Private
router.put('/constraints/:id', [
  auth,
  check('status', 'Status is required').isIn(['active', 'monitoring', 'resolved']),
], leadPredictabilityController.updateSalesConstraint);

// @route   GET api/lead-predictability/analytics/engagement
// @desc    Get engagement analytics
// @access  Private
router.get('/analytics/engagement', auth, leadPredictabilityController.getEngagementAnalytics);

// @route   GET api/lead-predictability/analytics/conversion
// @desc    Get conversion analytics
// @access  Private
router.get('/analytics/conversion', auth, leadPredictabilityController.getConversionAnalytics);

module.exports = router;
