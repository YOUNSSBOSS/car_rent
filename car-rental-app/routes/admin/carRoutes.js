const express = require('express');
const router = express.Router();
const carController = require('../../controllers/admin/carController'); // Adjusted path
const { ensureAuthenticated, isAdmin } = require('../../middleware/authMiddleware'); // Adjusted path
const upload = require('../../config/multerConfig'); // Adjusted path for multer upload config
const { body } = require('express-validator'); // New require for validation

// Protect all routes in this file
router.use(ensureAuthenticated, isAdmin);

// @route   GET /admin/cars
// @desc    Display list of all cars
router.get('/', carController.listCars);

// @route   GET /admin/cars/add
// @desc    Display form to add a new car
router.get('/add', carController.showAddCarForm);

// @route   POST /admin/cars/add
// @desc    Handle submission of the new car form
router.post(
    '/add',
    upload.single('carImage'), // Multer middleware first for file parsing
    [ // Validation rules array
        body('make').notEmpty().withMessage('Make is required.').trim().escape(),
        body('model').notEmpty().withMessage('Model is required.').trim().escape(),
        body('year')
            .notEmpty().withMessage('Year is required.')
            .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
            .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 1}.`),
        body('pricePerDay')
            .notEmpty().withMessage('Price per day is required.')
            .isFloat({ gt: 0 })
            .withMessage('Price per day must be a positive number.'),
        body('status').optional().isIn(['available', 'booked', 'maintenance']).withMessage('Invalid status.'),
        body('features').optional().trim().escape()
    ],
    carController.addCar
);

// @route   GET /admin/cars/edit/:id
// @desc    Display form to edit an existing car
router.get('/edit/:id', carController.showEditCarForm);

// @route   POST /admin/cars/edit/:id
// @desc    Handle submission of the edited car form
router.post(
    '/edit/:id',
    upload.single('carImage'), // Handles new image upload
    [ // Validation rules - similar to add, adjust if needed for edit
        body('make').notEmpty().withMessage('Make is required.').trim().escape(),
        body('model').notEmpty().withMessage('Model is required.').trim().escape(),
        body('year')
            .notEmpty().withMessage('Year is required.')
            .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
            .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 1}.`),
        body('pricePerDay')
            .notEmpty().withMessage('Price per day is required.')
            .isFloat({ gt: 0 })
            .withMessage('Price per day must be a positive number.'),
        body('status').optional().isIn(['available', 'booked', 'maintenance']).withMessage('Invalid status.'),
        body('features').optional().trim().escape()
    ],
    carController.editCar
);

// @route   POST /admin/cars/delete/:id
// @desc    Delete a car
router.post('/delete/:id', carController.deleteCar);

module.exports = router;
