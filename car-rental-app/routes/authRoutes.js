const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { forwardAuthenticated } = require('../middleware/authMiddleware'); // Import

// @route   GET /auth/register
// @desc    Render registration page
router.get('/register', forwardAuthenticated, authController.renderRegisterForm);

// @route   POST /auth/register
// @desc    Register a new user
router.post('/register', authController.registerUser);

// @route   GET /auth/login
// @desc    Render login page
router.get('/login', forwardAuthenticated, authController.renderLoginForm);

// @route   POST /auth/login
// @desc    Login user
router.post('/login', authController.loginUser);

// @route   GET /auth/logout
// @desc    Logout user
router.get('/logout', authController.logoutUser);

module.exports = router;
