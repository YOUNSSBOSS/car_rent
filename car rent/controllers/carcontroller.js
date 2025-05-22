const Car = require('../models/Car');

exports.getAllCars = async (req, res) => {
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.brand) filters.brand = req.query.brand;
  if (req.query.category) filters.category = req.query.category;

  const cars = await Car.find(filters);
  res.render('cars/list', { cars });
};

exports.getCarById = async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).send('Car not found');
  res.render('cars/detail', { car });
};

exports.createCar = async (req, res) => {
  const newCar = new Car(req.body);
  await newCar.save();
  res.redirect('/admin/cars');
};

exports.updateCar = async (req, res) => {
  await Car.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/admin/cars');
};

exports.deleteCar = async (req, res) => {
  await Car.findByIdAndDelete(req.params.id);
  res.redirect('/admin/cars');
};

exports.changeCarStatus = async (req, res) => {
  await Car.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.redirect('/admin/cars');
};
