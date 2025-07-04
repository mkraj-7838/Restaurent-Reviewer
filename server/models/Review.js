const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  reviewStatus: { 
    type: String, 
    enum: ['not reviewed', 'assigned', 'completed'],
    default: 'not reviewed' 
  },
  reviewedBy: { type: String, default: null }
});

module.exports = mongoose.model('Review', reviewSchema);