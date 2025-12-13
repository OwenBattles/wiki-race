// server/routes/wikiRoutes.js
const express = require('express');
const router = express.Router();
const wikiController = require('../controllers/wikiController');

// Define the route
router.get('/:page', wikiController.getWikiPage);

module.exports = router;