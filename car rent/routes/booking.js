const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const isClient = require('../middlewares/isClient');

// إجراء حجز
router.post('/book', isClient, bookingController.createBooking);

// عرض حجوزات المستخدم
router.get('/my-bookings', isClient, bookingController.getUserBookings);

module.exports = router;
