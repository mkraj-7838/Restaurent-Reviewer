const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  reviewed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Review', reviewSchema);