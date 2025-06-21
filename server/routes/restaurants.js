const express = require('express');
const jwt = require('jsonwebtoken');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const router = express.Router();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(2); // Distance in km, rounded to 2 decimals
}

router.get('/', authenticate, async (req, res) => {
  const { userLat, userLng } = req.query;
  const restaurants = await Restaurant.find();
  const reviews = await Review.find();
  const restaurantsWithReviews = restaurants.map(restaurant => {
    const distance = userLat && userLng && restaurant.Latitude && restaurant.Longitude
      ? calculateDistance(parseFloat(userLat), parseFloat(userLng), restaurant.Latitude, restaurant.Longitude)
      : null;
    const review = reviews.find(review => review.restaurantId.toString() === restaurant._id.toString());
    return {
      ...restaurant._doc,
      reviewed: review ? review.reviewed : false,
      reviewedBy: review ? review.reviewedBy : null,
      distance
    };
  });
  res.json(restaurantsWithReviews);
});

router.post('/review/:id', authenticate, async (req, res) => {
  const { reviewed, reviewedBy } = req.body;
  const restaurantId = req.params.id;
  await Review.findOneAndUpdate(
    { restaurantId },
    { restaurantId, reviewed, reviewedBy: reviewed ? reviewedBy : null },
    { upsert: true }
  );
  res.json({ message: 'Review status updated' });
});

module.exports = router;