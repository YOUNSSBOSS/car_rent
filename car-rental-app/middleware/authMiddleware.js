module.exports = {
  ensureAuthenticated: function(req, res, next) {
    if (req.session && req.session.user) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view this resource.');
    res.redirect('/auth/login');
  },

  isAdmin: function(req, res, next) {
    if (req.session && req.session.user && req.session.role === 'admin') {
      return next();
    }
    req.flash('error_msg', 'You are not authorized to view this resource.');
    // Or redirect to a specific 'unauthorized' page or homepage
    res.redirect('/'); 
  },

  // Optional: Forward authenticated users away from login/register pages
  forwardAuthenticated: function(req, res, next) {
    if (req.session && !req.session.user) { // User is not authenticated, proceed
      return next();
    }
    // User is authenticated, redirect them from login/register pages
    res.redirect('/'); 
  }
};
