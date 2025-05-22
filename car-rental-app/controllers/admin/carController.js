const Car = require('../../models/Car');
const { validationResult } = require('express-validator'); // For handling validation results
const fs = require('fs'); // For file system operations (deleting old image)
const path = require('path'); // For path operations

// Display list of all cars (as before)
exports.listCars = async (req, res) => {
    try {
        const cars = await Car.find();
        res.render('admin/cars/index', {
            pageTitle: 'Admin - Car Management',
            cars: cars,
            layout: 'layouts/admin_layout'
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching cars.');
        res.redirect('/admin/dashboard'); // Assuming an admin dashboard route exists or will exist
    }
};

// Display form to add a new car (as before)
exports.showAddCarForm = (req, res) => {
    res.render('admin/cars/add', {
        pageTitle: 'Admin - Add New Car',
        layout: 'layouts/admin_layout',
        car: {} 
    });
};

// Handle submission of the new car form (as before)
exports.addCar = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        req.flash('error_msg', errorMessages.join('<br>')); 
        return res.render('admin/cars/add', {
            pageTitle: 'Admin - Add New Car',
            layout: 'layouts/admin_layout',
            error_msg: req.flash('error_msg'), 
            car: { 
                make: req.body.make,
                model: req.body.model,
                year: req.body.year,
                pricePerDay: req.body.pricePerDay,
                status: req.body.status,
                features: req.body.features 
            }
        });
    }

    const { make, model, year, pricePerDay, features, status } = req.body;
    const imageURL = req.file ? '/uploads/cars/' + req.file.filename : null;

    try {
        const newCar = new Car({
            make,
            model,
            year,
            pricePerDay,
            status: status || 'available', 
            imageURL,
            features: features ? features.split(',').map(feature => feature.trim()) : []
        });

        await newCar.save();
        req.flash('success_msg', 'Car added successfully!');
        res.redirect('/admin/cars');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) { 
             req.flash('error_msg', 'A car with similar unique details already exists.');
        } else if (err.name === 'ValidationError') {
            let messages = Object.values(err.errors).map(val => val.message);
            req.flash('error_msg', messages.join('<br>'));
        }
        else {
             req.flash('error_msg', 'Server error: Could not add car.');
        }
        res.render('admin/cars/add', { 
            pageTitle: 'Admin - Add New Car',
            layout: 'layouts/admin_layout',
            error_msg: req.flash('error_msg'),
            car: { make, model, year, pricePerDay, status, features: req.body.features } 
        });
    }
};

// Display form to edit an existing car (as before)
exports.showEditCarForm = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            req.flash('error_msg', 'Car not found.');
            return res.redirect('/admin/cars');
        }
        res.render('admin/cars/edit', {
            pageTitle: 'Admin - Edit Car',
            layout: 'layouts/admin_layout',
            car: car, 
            featuresString: car.features ? car.features.join(', ') : ''
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching car details.');
        res.redirect('/admin/cars');
    }
};

// Handle submission of the edited car form (as before)
exports.editCar = async (req, res) => {
    const carId = req.params.id;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        req.flash('error_msg', errorMessages.join('<br>'));
        const car = await Car.findById(carId); 
        return res.render('admin/cars/edit', {
            pageTitle: 'Admin - Edit Car',
            layout: 'layouts/admin_layout',
            error_msg: req.flash('error_msg'),
            car: { 
                _id: carId, 
                make: req.body.make || (car ? car.make : ''),
                model: req.body.model || (car ? car.model : ''),
                year: req.body.year || (car ? car.year : ''),
                pricePerDay: req.body.pricePerDay || (car ? car.pricePerDay : ''),
                status: req.body.status || (car ? car.status : 'available'),
                features: req.body.features || (car && car.features ? car.features.join(', ') : ''), 
                imageURL: car ? car.imageURL : null 
            },
            featuresString: req.body.features || (car && car.features ? car.features.join(', ') : '')
        });
    }

    try {
        const carToUpdate = await Car.findById(carId);
        if (!carToUpdate) {
            req.flash('error_msg', 'Car not found for update.');
            return res.redirect('/admin/cars');
        }

        const oldImageURL = carToUpdate.imageURL;

        carToUpdate.make = req.body.make;
        carToUpdate.model = req.body.model;
        carToUpdate.year = req.body.year;
        carToUpdate.pricePerDay = req.body.pricePerDay;
        carToUpdate.status = req.body.status || 'available';
        carToUpdate.features = req.body.features ? req.body.features.split(',').map(feature => feature.trim()) : [];

        if (req.file) {
            carToUpdate.imageURL = '/uploads/cars/' + req.file.filename;
            if (oldImageURL && oldImageURL !== carToUpdate.imageURL) {
                const oldImagePath = path.join(__dirname, '../../public', oldImageURL);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlink(oldImagePath, (errUnlink) => { 
                        if (errUnlink) console.error("Error deleting old image:", errUnlink);
                    });
                }
            }
        }

        await carToUpdate.save();
        req.flash('success_msg', 'Car updated successfully!');
        res.redirect('/admin/cars');

    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
            let messages = Object.values(err.errors).map(val => val.message);
            req.flash('error_msg', messages.join('<br>'));
        } else {
            req.flash('error_msg', 'Server error: Could not update car.');
        }
        const car = await Car.findById(carId);
        res.render('admin/cars/edit', {
            pageTitle: 'Admin - Edit Car',
            layout: 'layouts/admin_layout',
            error_msg: req.flash('error_msg'),
            car: { 
                _id: carId,
                make: req.body.make || (car ? car.make : ''),
                model: req.body.model || (car ? car.model : ''),
                year: req.body.year || (car ? car.year : ''),
                pricePerDay: req.body.pricePerDay || (car ? car.pricePerDay : ''),
                status: req.body.status || (car ? car.status : 'available'),
                features: req.body.features || (car && car.features ? car.features.join(', ') : ''),
                imageURL: car ? car.imageURL : null 
            },
             featuresString: req.body.features || (car && car.features ? car.features.join(', ') : '')
        });
    }
};

// Handle deletion of a car
exports.deleteCar = async (req, res) => {
    const carId = req.params.id;
    try {
        const carToDelete = await Car.findById(carId);

        if (!carToDelete) {
            req.flash('error_msg', 'Car not found for deletion.');
            return res.redirect('/admin/cars');
        }

        // Delete the image file if it exists
        if (carToDelete.imageURL) {
            const imagePath = path.join(__dirname, '../../public', carToDelete.imageURL);
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error("Error deleting car image file:", err);
                        // Non-critical, so proceed with DB deletion but log error
                    }
                });
            }
        }

        await Car.findByIdAndDelete(carId); // Use findByIdAndDelete

        req.flash('success_msg', 'Car deleted successfully!');
        res.redirect('/admin/cars');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Server error: Could not delete car.');
        res.redirect('/admin/cars');
    }
};
