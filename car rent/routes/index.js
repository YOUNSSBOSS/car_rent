const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');

router.get('/', carController.getAllCars); // الصفحة الرئيسية
router.get('/car/:id', carController.getCarById); // تفاصيل سيارة

module.exports = router;
