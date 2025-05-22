const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  }
});

// 🔒 تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});
// في routes/user.js
const path = require('path');
const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/dashboard.html'));
});

module.exports = router;


// 🔐 دالة لمقارنة كلمة المرور عند تسجيل الدخول
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
