const Booking = require('../models/Booking');
const Car = require('../models/Car');

exports.createBooking = async (req, res) => {
  const { carId, startDate, endDate, paymentMethod } = req.body;
  const car = await Car.findById(carId);
  if (!car || car.status !== 'available') {
    return res.status(400).send('Car not available');
  }

  const totalDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
  const totalPrice = totalDays * car.price;

  const booking = new Booking({
    car: carId,
    user: req.session.userId,
    startDate,
    endDate,
    totalPrice,
    paymentMethod,
  });

  await booking.save();
  res.redirect('/my-bookings');
};

exports.getUserBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.session.userId }).populate('car');
  res.render('bookings/myBookings', { bookings });
};

exports.getAllBookings = async (req, res) => {
  const bookings = await Booking.find().populate('car user');
  res.render('admin/bookings', { bookings });
};
