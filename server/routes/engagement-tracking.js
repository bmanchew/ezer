const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const engagementTrackingController = require('../controllers/engagementTrackingController');

// SMS Tracking Routes
// @route   POST api/engagement/sms/track
// @desc    Track SMS click
// @access  Public
router.post('/sms/track', [
  check('tracking_id', 'Tracking ID is required').not().isEmpty(),
  check('phone', 'Phone number is required').not().isEmpty()
], engagementTrackingController.trackSMSClick);

// @route   GET api/engagement/sms/stats
// @desc    Get SMS engagement stats
// @access  Private
router.get('/sms/stats', auth, engagementTrackingController.getSMSStats);

// Ad Click Tracking Routes
// @route   POST api/engagement/ad/track
// @desc    Track ad click
// @access  Public
router.post('/ad/track', [
  check('tracking_id', 'Tracking ID is required').not().isEmpty(),
  check('source', 'Source is required').not().isEmpty()
], engagementTrackingController.trackAdClick);

// @route   GET api/engagement/ad/stats
// @desc    Get ad engagement stats
// @access  Private
router.get('/ad/stats', auth, engagementTrackingController.getAdStats);

// Facebook Ad Tracking Routes
// @route   POST api/engagement/facebook/track
// @desc    Track Facebook ad engagement
// @access  Public
router.post('/facebook/track', [
  check('tracking_id', 'Tracking ID is required').not().isEmpty(),
  check('ad_id', 'Ad ID is required').not().isEmpty()
], engagementTrackingController.trackFacebookAd);

// @route   GET api/engagement/facebook/stats
// @desc    Get Facebook ad engagement stats
// @access  Private
router.get('/facebook/stats', auth, engagementTrackingController.getFacebookStats);

// Website Tracking Routes
// @route   POST api/engagement/website/track
// @desc    Track website engagement
// @access  Public
router.post('/website/track', [
  check('tracking_id', 'Tracking ID is required').not().isEmpty(),
  check('page', 'Page is required').not().isEmpty(),
  check('action', 'Action is required').not().isEmpty()
], engagementTrackingController.trackWebsiteEngagement);

// @route   GET api/engagement/website/stats
// @desc    Get website engagement stats
// @access  Private
router.get('/website/stats', auth, engagementTrackingController.getWebsiteStats);

// Tracking Pixel Routes
// @route   GET api/engagement/pixel/:id
// @desc    Get tracking pixel
// @access  Public
router.get('/pixel/:id', engagementTrackingController.getTrackingPixel);

// @route   POST api/engagement/pixel/create
// @desc    Create tracking pixel
// @access  Private
router.post('/pixel/create', [
  auth,
  check('type', 'Type is required').not().isEmpty(),
  check('name', 'Name is required').not().isEmpty()
], engagementTrackingController.createTrackingPixel);

// Engagement Summary Routes
// @route   GET api/engagement/summary
// @desc    Get engagement summary
// @access  Private
router.get('/summary', auth, engagementTrackingController.getEngagementSummary);

// @route   GET api/engagement/lead/:id
// @desc    Get lead engagement history
// @access  Private
router.get('/lead/:id', auth, engagementTrackingController.getLeadEngagementHistory);

module.exports = router;
