const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  Mobile: String,
  Res_Name: String,
  Branch_Name: String,
  Cuisines: String,
  Address: String,
  Phone: String,
  Latitude: Number,
  Longitude: Number,
  City: String,
  Opening_Hours: String,
  Del_Rating: mongoose.Mixed,
  Rest_Image: String
});

module.exports = mongoose.model('Restaurant', restaurantSchema);