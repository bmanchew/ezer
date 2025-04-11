const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const shifiIntegrationController = require('../controllers/shifiIntegrationController');

// @route   GET api/shifi/auth
// @desc    Get ShiFi OAuth URL
// @access  Private
router.get('/auth', auth, shifiIntegrationController.getAuthUrl);

// @route   GET api/shifi/callback
// @desc    Handle OAuth callback from ShiFi
// @access  Public
router.get('/callback', shifiIntegrationController.handleCallback);

// @route   GET api/shifi/status
// @desc    Check ShiFi integration status
// @access  Private
router.get('/status', auth, shifiIntegrationController.getStatus);

// @route   POST api/shifi/disconnect
// @desc    Disconnect from ShiFi
// @access  Private
router.post('/disconnect', auth, shifiIntegrationController.disconnect);

// @route   POST api/shifi/voice/transcribe
// @desc    Transcribe audio using ShiFi's voice engine
// @access  Private
router.post('/voice/transcribe', [
  auth,
  check('audio_url', 'Audio URL is required').not().isEmpty()
], shifiIntegrationController.transcribeAudio);

// @route   POST api/shifi/voice/synthesize
// @desc    Synthesize speech using ShiFi's voice engine
// @access  Private
router.post('/voice/synthesize', [
  auth,
  check('text', 'Text is required').not().isEmpty()
], shifiIntegrationController.synthesizeSpeech);

// @route   POST api/shifi/ai/analyze
// @desc    Analyze data using ShiFi's AI model
// @access  Private
router.post('/ai/analyze', [
  auth,
  check('data', 'Data is required').not().isEmpty(),
  check('analysis_type', 'Analysis type is required').not().isEmpty()
], shifiIntegrationController.analyzeData);

// @route   GET api/shifi/app-store/status
// @desc    Check app store listing status
// @access  Private
router.get('/app-store/status', auth, shifiIntegrationController.getAppStoreStatus);

// @route   POST api/shifi/app-store/update
// @desc    Update app store listing
// @access  Private
router.post('/app-store/update', [
  auth,
  check('app_data', 'App data is required').not().isEmpty()
], shifiIntegrationController.updateAppStoreListing);

module.exports = router;
