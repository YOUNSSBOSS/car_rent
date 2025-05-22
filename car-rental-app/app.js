require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/database');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const csrf = require('csurf');
const expressLayouts = require('express-ejs-layouts');

// Require route files
const authRoutes = require('./routes/authRoutes');
const adminCarRoutes = require('./routes/admin/carRoutes');
const carRoutes = require('./routes/carRoutes'); // New public car routes

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.use(expressLayouts);
app.set('layout', './layouts/main_layout'); // Default layout
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Flash Messages
app.use(flash());

// CSRF Protection
const csrfProtection = csrf();
app.use(csrfProtection);

// Global variables for views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user;
  res.locals.userRole = req.session.role;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken();
  }
  res.locals.layout = res.locals.layout || 'layouts/main_layout'; 
  next();
});

// Public Routes
app.get('/', (req, res) => {
  res.render('index', { pageTitle: 'Welcome' }); // New homepage
});
app.use('/cars', carRoutes); // Mount public car routes

// Auth Routes
app.use('/auth', authRoutes);

// Admin Routes
app.use('/admin/cars', adminCarRoutes);


// 404 Error Handler
app.use((req, res, next) => {
  res.status(404).render('partials/404', { layout: 'layouts/main_layout', pageTitle: 'Page Not Found' });
});

// General Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    req.flash('error_msg', 'Form tempered or session expired. Please try again.');
    return res.redirect(req.path);
  }

  console.error(err.stack);
  res.status(err.status || 500);
  res.render('partials/error', {
    error: {
        message: err.message,
        status: err.status || 500,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    },
    layout: 'layouts/main_layout',
    pageTitle: 'Error'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
