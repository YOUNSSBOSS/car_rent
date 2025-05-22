const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();

// ✅ الاتصال بـ MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car_rent', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ✅ إعدادات EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ ملفات ثابتة (CSS, JS, صور)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Body Parser
app.use(express.urlencoded({ extended: false }));

// ✅ جلسات
app.use(session({
  secret: process.env.SESSION_SECRET || 'car_rent_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/car_rent'
  })
}));

// ✅ Flash Messages
app.use(flash());

// ✅ تمرير بيانات الجلسة للـ views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId;
  res.locals.role = req.session.role;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// ✅ المسارات
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const bookingRoutes = require('./routes/booking');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', bookingRoutes);
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/html/404.html'));
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚗 Car Rent server running at http://localhost:${PORT}`);
});
