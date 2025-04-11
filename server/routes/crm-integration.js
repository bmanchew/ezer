const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const crmIntegrationController = require('../controllers/crmIntegrationController');

// GHL Routes
// @route   GET api/crm/ghl/auth
// @desc    Get GHL OAuth URL
// @access  Private
router.get('/ghl/auth', auth, crmIntegrationController.getGHLAuthUrl);

// @route   GET api/crm/ghl/callback
// @desc    Handle OAuth callback from GHL
// @access  Public
router.get('/ghl/callback', crmIntegrationController.handleGHLCallback);

// @route   GET api/crm/ghl/status
// @desc    Check GHL integration status
// @access  Private
router.get('/ghl/status', auth, crmIntegrationController.getGHLStatus);

// @route   POST api/crm/ghl/disconnect
// @desc    Disconnect from GHL
// @access  Private
router.post('/ghl/disconnect', auth, crmIntegrationController.disconnectGHL);

// @route   GET api/crm/ghl/contacts
// @desc    Get contacts from GHL
// @access  Private
router.get('/ghl/contacts', auth, crmIntegrationController.getGHLContacts);

// Close Routes
// @route   GET api/crm/close/auth
// @desc    Get Close OAuth URL
// @access  Private
router.get('/close/auth', auth, crmIntegrationController.getCloseAuthUrl);

// @route   GET api/crm/close/callback
// @desc    Handle OAuth callback from Close
// @access  Public
router.get('/close/callback', crmIntegrationController.handleCloseCallback);

// @route   GET api/crm/close/status
// @desc    Check Close integration status
// @access  Private
router.get('/close/status', auth, crmIntegrationController.getCloseStatus);

// @route   POST api/crm/close/disconnect
// @desc    Disconnect from Close
// @access  Private
router.post('/close/disconnect', auth, crmIntegrationController.disconnectClose);

// @route   GET api/crm/close/leads
// @desc    Get leads from Close
// @access  Private
router.get('/close/leads', auth, crmIntegrationController.getCloseLeads);

// Hubspot Routes
// @route   GET api/crm/hubspot/auth
// @desc    Get Hubspot OAuth URL
// @access  Private
router.get('/hubspot/auth', auth, crmIntegrationController.getHubspotAuthUrl);

// @route   GET api/crm/hubspot/callback
// @desc    Handle OAuth callback from Hubspot
// @access  Public
router.get('/hubspot/callback', crmIntegrationController.handleHubspotCallback);

// @route   GET api/crm/hubspot/status
// @desc    Check Hubspot integration status
// @access  Private
router.get('/hubspot/status', auth, crmIntegrationController.getHubspotStatus);

// @route   POST api/crm/hubspot/disconnect
// @desc    Disconnect from Hubspot
// @access  Private
router.post('/hubspot/disconnect', auth, crmIntegrationController.disconnectHubspot);

// @route   GET api/crm/hubspot/contacts
// @desc    Get contacts from Hubspot
// @access  Private
router.get('/hubspot/contacts', auth, crmIntegrationController.getHubspotContacts);

// Sync Routes
// @route   POST api/crm/sync
// @desc    Sync data between CRMs and EzerAI
// @access  Private
router.post('/sync', [
  auth,
  check('source', 'Source is required').not().isEmpty(),
  check('entity_type', 'Entity type is required').not().isEmpty()
], crmIntegrationController.syncData);

// @route   GET api/crm/sync/status
// @desc    Get sync status
// @access  Private
router.get('/sync/status', auth, crmIntegrationController.getSyncStatus);

module.exports = router;
