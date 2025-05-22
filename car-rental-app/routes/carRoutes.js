const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController'); // Public car controller

// @route   GET /cars
// @desc    Display list of available cars
router.get('/', carController.listAvailableCars);

// @route   GET /cars/:id
// @desc    Display details for a specific car
router.get('/:id', carController.showCarDetails);

module.exports = router;
