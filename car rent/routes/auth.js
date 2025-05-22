const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/User');

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/login.html'));
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.redirect('/auth/login?error=اسم المستخدم غير موجود');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.redirect('/auth/login?error=كلمة المرور غير صحيحة');
    }

    req.session.userId = user._id;
    req.session.role = user.role;

    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/user/dashboard');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/auth/login?error=حدث خطأ');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
