const Car = require('../models/Car');

exports.listAvailableCars = async (req, res) => {
    try {
        let query = { status: 'available' };
        const queryParams = {}; // To pass back to the view for repopulating form

        // Text search for make or model
        if (req.query.search && req.query.search.trim() !== '') {
            const searchRegex = new RegExp(req.query.search.trim(), 'i'); // 'i' for case-insensitive
            query.$or = [
                { make: searchRegex },
                { model: searchRegex }
            ];
            queryParams.search = req.query.search.trim();
        }

        // Price range filter
        if (req.query.minPrice && !isNaN(parseFloat(req.query.minPrice))) {
            if (!query.pricePerDay) query.pricePerDay = {};
            query.pricePerDay.$gte = parseFloat(req.query.minPrice);
            queryParams.minPrice = req.query.minPrice;
        }
        if (req.query.maxPrice && !isNaN(parseFloat(req.query.maxPrice))) {
            if (!query.pricePerDay) query.pricePerDay = {};
            query.pricePerDay.$lte = parseFloat(req.query.maxPrice);
            queryParams.maxPrice = req.query.maxPrice;
        }
        // Add more filters here based on other fields like features, year, etc.

        const availableCars = await Car.find(query);

        res.render('cars/list', {
            pageTitle: 'Available Cars',
            cars: availableCars,
            layout: 'layouts/main_layout',
            queryParams: queryParams // Pass search/filter params back to view
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching available cars.');
        // Render the page with an error or redirect
        res.render('cars/list', {
            pageTitle: 'Available Cars',
            cars: [],
            layout: 'layouts/main_layout',
            queryParams: req.query, // Pass original query params
            error_msg: req.flash('error_msg') || 'Could not fetch cars.'
        });
    }
};

// showCarDetails function remains the same
exports.showCarDetails = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) { // Simplified check, availability check can be here or handled by booking logic
            req.flash('error_msg', 'Car not found.');
            return res.redirect('/cars');
        }
        res.render('cars/detail', {
            pageTitle: `${car.make} ${car.model}`,
            car: car,
            layout: 'layouts/main_layout'
        });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
             req.flash('error_msg', 'Car not found (invalid ID).');
             return res.redirect('/cars');
        }
        req.flash('error_msg', 'Error fetching car details.');
        res.redirect('/cars'); // Or render an error page
    }
};
