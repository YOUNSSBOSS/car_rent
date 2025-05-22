

module.exports = (req, res, next) => {
  if (req.session.userId && req.session.role === 'admin') {
    return next();
  }
  return res.redirect('/login');
};
