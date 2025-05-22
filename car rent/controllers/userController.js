const User = require('../models/User');

exports.showLogin = (req, res) => {
  res.render('auth/login');
};

exports.showRegister = (req, res) => {
  res.render('auth/register');
};

exports.register = async (req, res) => {
  const { username, password } = req.body;
  const user = new User({ username, password });
  await user.save();
  req.session.userId = user._id;
  req.session.role = user.role;
  res.redirect('/');
};

exports.login = async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user || !(await user.comparePassword(req.body.password))) {
    return res.render('auth/login', { error: 'Invalid credentials' });
  }
  req.session.userId = user._id;
  req.session.role = user.role;
  res.redirect('/');
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
