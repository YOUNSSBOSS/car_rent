const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const carController = require('../controllers/carController');
const bookingController = require('../controllers/bookingController');
const isAdmin = require('../middlewares/isAdmin');

// لوحة القيادة
router.get('/dashboard', isAdmin, adminController.dashboard);

const express = require('express');
const path = require('path');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

router.get('/dashboard', ensureAuthenticated, ensureAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/admin-dashboard.html'));
});

module.exports = router;

// إدارة السيارات
router.get('/cars', isAdmin, carController.getAllCars);
router.get('/cars/edit/:id', isAdmin, (req, res) => {
  res.render('admin/editCar', { carId: req.params.id }); // صفحة التعديل
});
router.post('/cars/add', isAdmin, carController.createCar);
router.post('/cars/update/:id', isAdmin, carController.updateCar);
router.post('/cars/delete/:id', isAdmin, carController.deleteCar);
router.post('/cars/status/:id', isAdmin, carController.changeCarStatus);

// إدارة الحجوزات
router.get('/bookings', isAdmin, bookingController.getAllBookings);

module.exports = router;
