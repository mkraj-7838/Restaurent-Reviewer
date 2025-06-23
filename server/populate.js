const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected');
    const restaurants = [
  {
    "Res_Name": "Dastarkhwan",
    "Mobile": "918368102053",
    "Address": "Friends Colony, New Delhi",
    "Latitude": 28.57903259,
    "Longitude": 77.25950819
  }];
    await Restaurant.deleteMany({});
    await Restaurant.insertMany(restaurants);
    console.log('Restaurants inserted');
    mongoose.connection.close();
  })
  .catch(err => console.error(err));