const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, required: true },
  brand: { type: String, required: true },
  status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  price: { type: Number, required: true },
  image: { type: String },
  ratings: [{ type: Number }],
  createdAt: { type: Date, default: Date.now }
});

carSchema.methods.getAverageRating = function () {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r, 0);
  return sum / this.ratings.length;
};

module.exports = mongoose.model('Car', carSchema);
