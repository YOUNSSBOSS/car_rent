module.exports = (req, res, next) => {
  if (req.session.userId && req.session.role === 'client') {
    return next();
  }
  return res.redirect('/login');
};
