const User = require('../models/User'); // Assuming User model is in ../models/User.js

// Render registration form
exports.renderRegisterForm = (req, res) => {
  res.render('auth/register', { pageTitle: 'Register' });
};

// Handle user registration
exports.registerUser = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Basic validation (more robust validation later)
  if (!username || !email || !password || !confirmPassword) {
    req.flash('error_msg', 'Please fill in all fields.');
    return res.redirect('/auth/register');
  }

  if (password !== confirmPassword) {
    req.flash('error_msg', 'Passwords do not match.');
    return res.redirect('/auth/register');
  }

  if (password.length < 6) {
    req.flash('error_msg', 'Password must be at least 6 characters.');
    return res.redirect('/auth/register');
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      req.flash('error_msg', 'User with that email already exists.');
      return res.redirect('/auth/register');
    }
    
    user = await User.findOne({ username });
    if (user) {
      req.flash('error_msg', 'User with that username already exists.');
      return res.redirect('/auth/register');
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    // Store user info in session (excluding password)
    req.session.user = { id: newUser._id, username: newUser.username };
    req.session.role = newUser.role; // Store role

    req.flash('success_msg', 'You are now registered and logged in!');
    res.redirect('/'); // Redirect to homepage or dashboard
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Server error during registration.');
    res.redirect('/auth/register');
  }
};

// Render login form
exports.renderLoginForm = (req, res) => {
  res.render('auth/login', { pageTitle: 'Login' });
};

// Handle user login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error_msg', 'Please provide email and password.');
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password
    if (!user) {
      req.flash('error_msg', 'Invalid credentials.');
      return res.redirect('/auth/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid credentials.');
      return res.redirect('/auth/login');
    }

    // Store user info in session
    req.session.user = { id: user._id, username: user.username };
    req.session.role = user.role; // Store role

    req.flash('success_msg', 'You are now logged in!');
    res.redirect('/'); // Redirect to homepage or dashboard
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Server error during login.');
    res.redirect('/auth/login');
  }
};

// Handle user logout
exports.logoutUser = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Session destruction error:", err);
      req.flash('error_msg', 'Failed to logout.');
      return res.redirect('/');
    }
    res.clearCookie('connect.sid'); // Optional: clear the session cookie
    req.flash('success_msg', 'You have successfully logged out.');
    res.redirect('/auth/login');
  });
};
