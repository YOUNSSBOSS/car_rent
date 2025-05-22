const Car = require('../models/Car');
const Booking = require('../models/Booking');
const User = require('../models/User');

exports.dashboard = async (req, res) => {
  const totalCars = await Car.countDocuments();
  const totalBookings = await Booking.countDocuments();
  const totalUsers = await User.countDocuments();
  const todayBookings = await Booking.countDocuments({
    createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
  });

  res.render('admin/dashboard', {
    totalCars,
    totalBookings,
    totalUsers,
    todayBookings
  });
};
